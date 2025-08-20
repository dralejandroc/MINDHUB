const jwt = require('jsonwebtoken');
const crypto = require('crypto');

class TokenService {
    constructor() {
        this.secretKey = process.env.INTEGRIX_JWT_SECRET || crypto.randomBytes(64).toString('hex');
        this.defaultTTL = 3600; // 1 hour
    }

    generateHubLinkToken(payload) {
        const {
            userId,
            sourceHub,
            targetHub,
            operation,
            entityId,
            permissions = [],
            ttl = this.defaultTTL
        } = payload;

        const tokenPayload = {
            iss: 'integrix',
            sub: userId,
            source_hub: sourceHub,
            target_hub: targetHub,
            operation: operation,
            entity_id: entityId,
            permissions: permissions,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + ttl,
            jti: crypto.randomUUID()
        };

        return jwt.sign(tokenPayload, this.secretKey, { algorithm: 'HS256' });
    }

    verifyHubLinkToken(token) {
        try {
            const decoded = jwt.verify(token, this.secretKey);
            
            // Verificar que es un token de Integrix
            if (decoded.iss !== 'integrix') {
                throw new Error('Invalid token issuer');
            }

            // Verificar que no ha expirado
            if (decoded.exp < Math.floor(Date.now() / 1000)) {
                throw new Error('Token has expired');
            }

            return {
                valid: true,
                payload: decoded
            };
        } catch (error) {
            return {
                valid: false,
                error: error.message
            };
        }
    }

    generateClinimetrixToExpedixToken(userId, patientId, administrationId, permissions = ['read_assessment', 'write_medical_history']) {
        return this.generateHubLinkToken({
            userId,
            sourceHub: 'clinimetrix',
            targetHub: 'expedix',
            operation: 'attach_assessment_results',
            entityId: administrationId,
            permissions,
            ttl: 1800 // 30 minutos para esta operación
        });
    }

    generateExpedixToClinimetrixToken(userId, patientId, consultationId, scaleIds = [], permissions = ['read_patient', 'create_assessment']) {
        return this.generateHubLinkToken({
            userId,
            sourceHub: 'expedix',
            targetHub: 'clinimetrix',
            operation: 'request_assessment',
            entityId: consultationId,
            permissions,
            ttl: 3600 // 1 hora para completar la evaluación
        });
    }

    generateFormXIntegrationToken(userId, sourceHub, entityId, formType, permissions = ['create_form', 'read_form']) {
        return this.generateHubLinkToken({
            userId,
            sourceHub,
            targetHub: 'formx',
            operation: 'generate_custom_form',
            entityId,
            permissions,
            ttl: 7200 // 2 horas para formularios
        });
    }

    generatePatientTimelineToken(userId, patientId, requestingHub, permissions = ['read_patient_data']) {
        return this.generateHubLinkToken({
            userId,
            sourceHub: requestingHub,
            targetHub: 'all',
            operation: 'get_patient_timeline',
            entityId: patientId,
            permissions,
            ttl: 900 // 15 minutos para vistas de datos
        });
    }

    extractUserFromToken(token) {
        const verification = this.verifyHubLinkToken(token);
        if (!verification.valid) {
            return null;
        }
        return {
            userId: verification.payload.sub,
            sourceHub: verification.payload.source_hub,
            targetHub: verification.payload.target_hub,
            operation: verification.payload.operation,
            entityId: verification.payload.entity_id,
            permissions: verification.payload.permissions
        };
    }

    hasPermission(token, requiredPermission) {
        const tokenData = this.extractUserFromToken(token);
        if (!tokenData) {
            return false;
        }
        return tokenData.permissions.includes(requiredPermission);
    }
}

module.exports = new TokenService();