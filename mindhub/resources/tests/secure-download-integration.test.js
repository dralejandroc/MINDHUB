/**
 * Integration Tests for Secure Download System
 * 
 * Tests the complete flow of secure downloads including token generation,
 * validation, personalization, and file delivery.
 */

const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const SecureDownloadService = require('../services/SecureDownloadService');
const PersonalizationService = require('../services/PersonalizationService');

// Mock Express app for testing
const app = express();
app.use(express.json());

// Mock authentication middleware
app.use((req, res, next) => {
  req.user = {
    id: 'test-user-123',
    role: 'psychiatrist',
    clinicId: 'clinic-001'
  };
  next();
});

// Use the actual routes
app.use('/api/resources', require('../routes/secure-downloads'));

describe('Secure Download System Integration Tests', () => {
  let downloadService;
  let personalizationService;
  let mockResourceId;
  let validToken;

  beforeAll(async () => {
    // Initialize services
    downloadService = new SecureDownloadService({
      jwtSecret: 'test-secret-key',
      tokenExpiration: '1h',
      maxDownloadAttempts: 3
    });

    personalizationService = new PersonalizationService();

    // Mock resource for testing
    mockResourceId = 'resource-test-123';
  });

  beforeEach(async () => {
    // Clear any existing tokens
    downloadService.activeTokens.clear();
    downloadService.rateLimitTracker.clear();
  });

  describe('Token Generation Flow', () => {
    test('should generate download token for valid resource', async () => {
      const response = await request(app)
        .post('/api/resources/download/token')
        .send({
          resourceId: mockResourceId,
          personalizationData: {
            variables: {
              nombrePaciente: 'Juan Pérez',
              nombreClinica: 'Clínica MindHub',
              nombreProfesional: 'Dr. María García'
            },
            outputFormat: 'pdf'
          }
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('downloadToken');
      expect(response.body.data).toHaveProperty('downloadUrl');
      expect(response.body.data).toHaveProperty('expiresAt');

      validToken = response.body.data.downloadToken;
    });

    test('should validate required fields for token generation', async () => {
      const response = await request(app)
        .post('/api/resources/download/token')
        .send({
          // Missing resourceId
          personalizationData: {
            variables: {
              nombrePaciente: 'Juan Pérez'
            }
          }
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    test('should apply rate limiting for token generation', async () => {
      // Make multiple requests to trigger rate limit
      const promises = [];
      for (let i = 0; i < 12; i++) {
        promises.push(
          request(app)
            .post('/api/resources/download/token')
            .send({ resourceId: mockResourceId })
        );
      }

      const responses = await Promise.all(promises);
      
      // Some requests should be rate limited
      const rateLimited = responses.filter(res => res.status === 429);
      expect(rateLimited.length).toBeGreaterThan(0);
    });
  });

  describe('Download Process Flow', () => {
    beforeEach(async () => {
      // Generate valid token for download tests
      const tokenResult = await downloadService.generateDownloadToken(
        mockResourceId,
        'test-user-123',
        { ipAddress: '127.0.0.1', userAgent: 'test-agent' }
      );
      validToken = tokenResult.downloadToken;
    });

    test('should download resource with valid token', async () => {
      // Mock the resource details
      const originalGetResourceDetails = downloadService.getResourceDetails;
      downloadService.getResourceDetails = jest.fn().mockResolvedValue({
        id: mockResourceId,
        title: 'Test Resource',
        type: 'text',
        status: 'active',
        content: {
          rawText: 'Hello {nombrePaciente}, this is from {nombreClinica}.',
          mimeType: 'text/plain'
        },
        personalization: {
          enabled: true
        }
      });

      const response = await request(app)
        .get(`/api/resources/download/${validToken}`)
        .query({
          personalize: JSON.stringify({
            variables: {
              nombrePaciente: 'María López',
              nombreClinica: 'Centro de Salud Mental'
            }
          })
        })
        .expect(200);

      expect(response.headers['content-disposition']).toContain('attachment');
      expect(response.headers['x-download-id']).toBeDefined();

      // Restore original method
      downloadService.getResourceDetails = originalGetResourceDetails;
    });

    test('should reject expired tokens', async () => {
      // Create expired token
      const expiredToken = jwt.sign(
        {
          tokenId: 'expired-token',
          resourceId: mockResourceId,
          userId: 'test-user-123',
          restrictions: {
            expiresAt: Date.now() - 3600000 // 1 hour ago
          }
        },
        'test-secret-key'
      );

      downloadService.activeTokens.set('expired-token', {
        resourceId: mockResourceId,
        userId: 'test-user-123',
        createdAt: Date.now() - 3600000,
        attempts: 0,
        maxAttempts: 3
      });

      const response = await request(app)
        .get(`/api/resources/download/${expiredToken}`)
        .expect(410);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('expired');
    });

    test('should track download attempts and enforce limits', async () => {
      // Set token to have maximum attempts
      const tokenInfo = downloadService.activeTokens.get(validToken);
      if (tokenInfo) {
        tokenInfo.attempts = 2; // One attempt left
        downloadService.activeTokens.set(validToken, tokenInfo);
      }

      // Mock resource details
      downloadService.getResourceDetails = jest.fn().mockResolvedValue({
        id: mockResourceId,
        title: 'Test Resource',
        type: 'text',
        status: 'active',
        content: {
          rawText: 'Test content',
          mimeType: 'text/plain'
        }
      });

      // First download should succeed
      await request(app)
        .get(`/api/resources/download/${validToken}`)
        .expect(200);

      // Second download should fail (attempts exceeded)
      await request(app)
        .get(`/api/resources/download/${validToken}`)
        .expect(429);
    });
  });

  describe('Preview Generation Flow', () => {
    test('should generate content preview without downloading', async () => {
      // Mock resource access validation
      downloadService.validateResourceAccess = jest.fn().mockResolvedValue(true);
      downloadService.getResourceDetails = jest.fn().mockResolvedValue({
        id: mockResourceId,
        title: 'Test Preview Resource',
        type: 'text',
        content: {
          rawText: 'Estimado/a {nombrePaciente}, desde {nombreClinica} le enviamos esta información...'
        }
      });

      const response = await request(app)
        .post('/api/resources/download/preview')
        .send({
          resourceId: mockResourceId,
          personalizationData: {
            variables: {
              nombrePaciente: 'Ana García',
              nombreClinica: 'Hospital General'
            }
          }
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.previewContent).toContain('Ana García');
      expect(response.body.data.previewContent).toContain('Hospital General');
      expect(response.body.data.variables).toBeDefined();
    });

    test('should handle non-text resources in preview', async () => {
      downloadService.validateResourceAccess = jest.fn().mockResolvedValue(true);
      downloadService.getResourceDetails = jest.fn().mockResolvedValue({
        id: mockResourceId,
        title: 'Test PDF Resource',
        type: 'pdf',
        content: {
          filePath: '/path/to/file.pdf',
          fileSize: 1024000
        }
      });

      const response = await request(app)
        .post('/api/resources/download/preview')
        .send({
          resourceId: mockResourceId,
          personalizationData: {
            variables: {
              nombrePaciente: 'Carlos Ruiz'
            }
          }
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toContain('Preview not available');
      expect(response.body.data.resourceType).toBe('pdf');
    });
  });

  describe('Token Status and Management', () => {
    test('should check token status', async () => {
      const tokenInfo = downloadService.activeTokens.get(validToken);
      
      const response = await request(app)
        .get(`/api/resources/download/status/${validToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isValid).toBe(true);
      expect(response.body.data.remainingAttempts).toBeDefined();
      expect(response.body.data.expiresAt).toBeDefined();
    });

    test('should revoke download token', async () => {
      const response = await request(app)
        .delete(`/api/resources/download/token/${validToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('revoked');

      // Token should no longer exist
      expect(downloadService.activeTokens.has(validToken)).toBe(false);
    });
  });

  describe('Bulk Operations', () => {
    test('should generate multiple download tokens', async () => {
      const response = await request(app)
        .post('/api/resources/download/bulk-token')
        .send({
          resourceIds: [mockResourceId, 'resource-test-456', 'resource-test-789'],
          commonPersonalization: {
            variables: {
              nombreProfesional: 'Dr. Ana López'
            }
          }
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tokens).toHaveLength(3);
      expect(response.body.data.summary.total).toBe(3);
    });

    test('should handle partial failures in bulk operations', async () => {
      // Mock one resource to fail access validation
      const originalValidateAccess = downloadService.validateResourceAccess;
      downloadService.validateResourceAccess = jest.fn()
        .mockResolvedValueOnce(true)
        .mockRejectedValueOnce(new Error('Access denied'))
        .mockResolvedValueOnce(true);

      const response = await request(app)
        .post('/api/resources/download/bulk-token')
        .send({
          resourceIds: [mockResourceId, 'forbidden-resource', 'resource-test-789']
        })
        .expect(200);

      expect(response.body.data.summary.successful).toBe(2);
      expect(response.body.data.summary.failed).toBe(1);
      expect(response.body.data.errors).toHaveLength(1);

      downloadService.validateResourceAccess = originalValidateAccess;
    });
  });

  describe('Personalization Service Integration', () => {
    test('should personalize text content correctly', async () => {
      const templateText = 'Hola {nombrePaciente}, desde {nombreClinica} le enviamos saludos.';
      const variables = {
        nombrePaciente: 'Pedro Martínez',
        nombreClinica: 'Clínica Esperanza'
      };

      const result = await personalizationService.personalizeText(templateText, variables);

      expect(result).toContain('Pedro Martínez');
      expect(result).toContain('Clínica Esperanza');
      expect(result).not.toContain('{nombrePaciente}');
    });

    test('should generate PDF with personalization', async () => {
      const content = 'Documento personalizado para {nombrePaciente}';
      const variables = {
        nombrePaciente: 'Laura Sánchez',
        nombreClinica: 'Centro Médico'
      };

      const pdfBuffer = await personalizationService.generatePersonalizedPDF(content, variables);

      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(0);
    });

    test('should extract variables from template', async () => {
      const templateText = 'Hola {nombrePaciente}, desde {nombreClinica} el {fechaHoy}';
      const variables = personalizationService.extractVariables(templateText);

      expect(variables).toContain('nombrePaciente');
      expect(variables).toContain('nombreClinica');
      expect(variables).toContain('fechaHoy');
      expect(variables).toHaveLength(3);
    });

    test('should generate content preview', async () => {
      const templateText = 'Este es un documento para {nombrePaciente} de {nombreClinica}. '.repeat(20);
      const variables = {
        nombrePaciente: 'Ana Torres',
        nombreClinica: 'Hospital Central'
      };

      const preview = await personalizationService.generatePreview(templateText, variables);

      expect(preview.preview).toContain('Ana Torres');
      expect(preview.preview.length).toBeLessThanOrEqual(503); // 500 + "..."
      expect(preview.fullLength).toBeGreaterThan(preview.preview.length);
      expect(preview.variablesUsed).toBe(2);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle invalid token format', async () => {
      const response = await request(app)
        .get('/api/resources/download/invalid-token')
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should handle missing resource', async () => {
      downloadService.getResourceDetails = jest.fn().mockResolvedValue(null);

      const response = await request(app)
        .get(`/api/resources/download/${validToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });

    test('should handle personalization errors gracefully', async () => {
      const invalidTemplate = 'Text with {{unclosed variable';
      
      const result = await personalizationService.personalizeText(invalidTemplate, {});
      
      // Should fall back to basic replacement
      expect(result).toBe(invalidTemplate);
    });
  });

  describe('Security Validations', () => {
    test('should validate IP address restrictions', async () => {
      // Generate token with IP restriction
      const restrictedToken = await downloadService.generateDownloadToken(
        mockResourceId,
        'test-user-123',
        { ipAddress: '192.168.1.100', userAgent: 'test-agent' }
      );

      downloadService.getResourceDetails = jest.fn().mockResolvedValue({
        id: mockResourceId,
        title: 'Test Resource',
        type: 'text',
        status: 'active',
        content: { rawText: 'Test', mimeType: 'text/plain' }
      });

      // Mock different IP address in request
      const originalProcessDownload = downloadService.processSecureDownload;
      downloadService.processSecureDownload = jest.fn().mockRejectedValue(
        new Error('Download request from unauthorized IP address')
      );

      const response = await request(app)
        .get(`/api/resources/download/${restrictedToken.downloadToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);

      downloadService.processSecureDownload = originalProcessDownload;
    });

    test('should log security events', async () => {
      const originalLogActivity = downloadService.logDownloadActivity;
      const logSpy = jest.fn();
      downloadService.logDownloadActivity = logSpy;

      await downloadService.generateDownloadToken(
        mockResourceId,
        'test-user-123',
        { ipAddress: '127.0.0.1' }
      );

      expect(logSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'token_generated',
          resourceId: mockResourceId,
          userId: 'test-user-123'
        })
      );

      downloadService.logDownloadActivity = originalLogActivity;
    });
  });

  afterAll(async () => {
    // Cleanup
    downloadService.activeTokens.clear();
    downloadService.rateLimitTracker.clear();
  });
});