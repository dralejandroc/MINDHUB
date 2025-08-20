/**
 * Data Sanitization Utilities for MindHub Healthcare Platform
 * 
 * Advanced sanitization for healthcare data with PHI protection,
 * XSS prevention, and compliance with medical data standards
 */

const validator = require('validator');
const DOMPurify = require('isomorphic-dompurify');

class DataSanitizers {
  constructor() {
    this.sanitizationRules = this.initializeSanitizationRules();
    this.phiMaskingRules = this.initializePHIMaskingRules();
    this.allowedHTMLTags = this.initializeAllowedHTMLTags();
  }

  /**
   * Initialize sanitization rules for different data types
   */
  initializeSanitizationRules() {
    return {
      // Basic sanitization
      string: {
        trim: true,
        escape: true,
        maxLength: 1000,
        removeNullBytes: true
      },

      // Healthcare names (preserve accents, remove special chars)
      healthcareName: {
        pattern: /[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s'-]/g,
        replacement: '',
        trim: true,
        maxLength: 100,
        normalizeSpaces: true
      },

      // Phone numbers
      phone: {
        pattern: /[^\d+\-\s()]/g,
        replacement: '',
        format: 'mexican',
        normalize: true
      },

      // Email addresses
      email: {
        normalize: true,
        lowercase: true,
        removeSubaddress: false,
        validateDomain: true
      },

      // Clinical notes and medical text
      medicalText: {
        removeHTML: true,
        escape: true,
        maxLength: 2000,
        preserveLineBreaks: true,
        removeDangerousChars: true
      },

      // Numeric data
      numeric: {
        removeNonNumeric: true,
        precision: 2,
        range: { min: -999999, max: 999999 }
      },

      // Identifiers (medical record numbers, etc.)
      identifier: {
        uppercase: true,
        pattern: /[^A-Z0-9\-]/g,
        replacement: '',
        maxLength: 50
      }
    };
  }

  /**
   * Initialize PHI masking rules
   */
  initializePHIMaskingRules() {
    return {
      // Full masking for logs
      full: {
        name: '***NAME***',
        email: '***EMAIL***',
        phone: '***PHONE***',
        address: '***ADDRESS***',
        id: '***ID***'
      },

      // Partial masking for display
      partial: {
        name: (value) => this.maskName(value),
        email: (value) => this.maskEmail(value),
        phone: (value) => this.maskPhone(value),
        address: (value) => this.maskAddress(value),
        id: (value) => this.maskId(value)
      },

      // PHI field detection patterns
      patterns: {
        name: /^(first|last|full)?name$/i,
        email: /email/i,
        phone: /phone|mobile|tel/i,
        address: /address|street|city|zip/i,
        id: /id|number|ssn|curp/i,
        dob: /birth|dob|age/i
      }
    };
  }

  /**
   * Initialize allowed HTML tags for medical content
   */
  initializeAllowedHTMLTags() {
    return {
      // Safe tags for medical documentation
      medical: {
        tags: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li'],
        attributes: {},
        protocols: []
      },

      // Basic formatting only
      basic: {
        tags: ['br', 'p'],
        attributes: {},
        protocols: []
      },

      // No HTML allowed
      none: {
        tags: [],
        attributes: {},
        protocols: []
      }
    };
  }

  /**
   * Sanitize healthcare name (preserve Spanish accents)
   */
  sanitizeName(value, options = {}) {
    if (!value || typeof value !== 'string') return '';

    const rules = { ...this.sanitizationRules.healthcareName, ...options };
    
    let sanitized = value;

    // Trim whitespace
    if (rules.trim) {
      sanitized = sanitized.trim();
    }

    // Remove invalid characters while preserving Spanish accents
    if (rules.pattern) {
      sanitized = sanitized.replace(rules.pattern, rules.replacement);
    }

    // Normalize multiple spaces to single space
    if (rules.normalizeSpaces) {
      sanitized = sanitized.replace(/\s+/g, ' ');
    }

    // Apply length limit
    if (rules.maxLength) {
      sanitized = sanitized.substring(0, rules.maxLength);
    }

    // Capitalize each word properly
    sanitized = sanitized.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');

    return sanitized;
  }

  /**
   * Sanitize Mexican phone number
   */
  sanitizePhone(value, options = {}) {
    if (!value || typeof value !== 'string') return '';

    const rules = { ...this.sanitizationRules.phone, ...options };
    
    let sanitized = value;

    // Remove non-numeric characters except +, -, spaces, and parentheses
    if (rules.pattern) {
      sanitized = sanitized.replace(rules.pattern, rules.replacement);
    }

    // Normalize to Mexican format if requested
    if (rules.format === 'mexican' && rules.normalize) {
      sanitized = this.normalizeMexicanPhone(sanitized);
    }

    return sanitized;
  }

  /**
   * Normalize Mexican phone number to standard format
   */
  normalizeMexicanPhone(phone) {
    // Remove all non-numeric characters
    const digits = phone.replace(/\D/g, '');
    
    // Handle different Mexican phone number formats
    if (digits.length === 10) {
      // Local format: 5512345678 -> +52-55-1234-5678
      return `+52-${digits.substring(0, 2)}-${digits.substring(2, 6)}-${digits.substring(6)}`;
    } else if (digits.length === 12 && digits.startsWith('52')) {
      // With country code: 525512345678 -> +52-55-1234-5678
      const local = digits.substring(2);
      return `+52-${local.substring(0, 2)}-${local.substring(2, 6)}-${local.substring(6)}`;
    } else if (digits.length === 13 && digits.startsWith('152')) {
      // With international prefix: 15255123456748 -> +52-55-1234-5678
      const local = digits.substring(3);
      return `+52-${local.substring(0, 2)}-${local.substring(2, 6)}-${local.substring(6)}`;
    }
    
    // Return original if format not recognized
    return phone;
  }

  /**
   * Sanitize email address
   */
  sanitizeEmail(value, options = {}) {
    if (!value || typeof value !== 'string') return '';

    const rules = { ...this.sanitizationRules.email, ...options };
    
    let sanitized = value.trim();

    // Normalize email
    if (rules.normalize) {
      try {
        sanitized = validator.normalizeEmail(sanitized, {
          gmail_remove_dots: false,
          gmail_remove_subaddress: rules.removeSubaddress,
          outlookdotcom_remove_subaddress: rules.removeSubaddress,
          yahoo_remove_subaddress: rules.removeSubaddress,
          icloud_remove_subaddress: rules.removeSubaddress
        });
      } catch (error) {
        // If normalization fails, continue with original
      }
    }

    // Convert to lowercase
    if (rules.lowercase) {
      sanitized = sanitized.toLowerCase();
    }

    // Validate email format
    if (rules.validateDomain && !validator.isEmail(sanitized)) {
      return '';
    }

    return sanitized || '';
  }

  /**
   * Sanitize medical text and clinical notes
   */
  sanitizeMedicalText(value, options = {}) {
    if (!value || typeof value !== 'string') return '';

    const rules = { ...this.sanitizationRules.medicalText, ...options };
    
    let sanitized = value;

    // Remove HTML tags but preserve line breaks
    if (rules.removeHTML) {
      // Convert <br> tags to newlines first
      sanitized = sanitized.replace(/<br\s*\/?>/gi, '\n');
      
      // Remove all other HTML tags
      sanitized = sanitized.replace(/<[^>]*>/g, '');
    }

    // Remove dangerous characters that could be used for injection
    if (rules.removeDangerousChars) {
      sanitized = sanitized.replace(/[<>{}]/g, '');
    }

    // Escape HTML entities
    if (rules.escape) {
      sanitized = validator.escape(sanitized);
    }

    // Preserve line breaks if requested
    if (rules.preserveLineBreaks) {
      sanitized = sanitized.replace(/\n/g, '<br>');
    }

    // Apply length limit
    if (rules.maxLength) {
      sanitized = sanitized.substring(0, rules.maxLength);
    }

    return sanitized.trim();
  }

  /**
   * Sanitize numeric values
   */
  sanitizeNumeric(value, options = {}) {
    if (value === null || value === undefined) return null;

    const rules = { ...this.sanitizationRules.numeric, ...options };
    
    let sanitized = value;

    // Convert to string for processing
    if (typeof sanitized !== 'string') {
      sanitized = String(sanitized);
    }

    // Remove non-numeric characters
    if (rules.removeNonNumeric) {
      sanitized = sanitized.replace(/[^\d.-]/g, '');
    }

    // Convert to number
    const num = parseFloat(sanitized);
    
    if (isNaN(num)) return null;

    // Apply range limits
    if (rules.range) {
      if (num < rules.range.min) return rules.range.min;
      if (num > rules.range.max) return rules.range.max;
    }

    // Apply precision
    if (rules.precision !== undefined) {
      return parseFloat(num.toFixed(rules.precision));
    }

    return num;
  }

  /**
   * Sanitize identifier (medical record numbers, etc.)
   */
  sanitizeIdentifier(value, options = {}) {
    if (!value || typeof value !== 'string') return '';

    const rules = { ...this.sanitizationRules.identifier, ...options };
    
    let sanitized = value.trim();

    // Convert to uppercase
    if (rules.uppercase) {
      sanitized = sanitized.toUpperCase();
    }

    // Remove invalid characters
    if (rules.pattern) {
      sanitized = sanitized.replace(rules.pattern, rules.replacement);
    }

    // Apply length limit
    if (rules.maxLength) {
      sanitized = sanitized.substring(0, rules.maxLength);
    }

    return sanitized;
  }

  /**
   * Sanitize object recursively
   */
  sanitizeObject(obj, sanitizationMap = {}, options = {}) {
    if (!obj || typeof obj !== 'object') return obj;

    const sanitized = Array.isArray(obj) ? [] : {};
    
    for (const [key, value] of Object.entries(obj)) {
      // Skip if key is in exclusion list
      if (options.exclude && options.exclude.includes(key)) {
        sanitized[key] = value;
        continue;
      }

      // Get sanitization rule for this field
      const sanitizationRule = sanitizationMap[key] || this.detectFieldSanitization(key, value);

      if (typeof value === 'string') {
        sanitized[key] = this.applySanitization(value, sanitizationRule);
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeObject(value, sanitizationMap, options);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Detect appropriate sanitization based on field name and value
   */
  detectFieldSanitization(fieldName, value) {
    const lowerFieldName = fieldName.toLowerCase();

    // Check for PHI fields
    for (const [type, pattern] of Object.entries(this.phiMaskingRules.patterns)) {
      if (pattern.test(lowerFieldName)) {
        switch (type) {
          case 'name': return 'name';
          case 'email': return 'email';
          case 'phone': return 'phone';
          case 'id': return 'identifier';
          default: return 'string';
        }
      }
    }

    // Check for medical/clinical fields
    if (/note|comment|observation|clinical|medical/.test(lowerFieldName)) {
      return 'medicalText';
    }

    // Check for numeric fields
    if (typeof value === 'number' || /score|weight|height|age|count/.test(lowerFieldName)) {
      return 'numeric';
    }

    // Default to string sanitization
    return 'string';
  }

  /**
   * Apply specific sanitization rule
   */
  applySanitization(value, rule) {
    switch (rule) {
      case 'name':
        return this.sanitizeName(value);
      case 'email':
        return this.sanitizeEmail(value);
      case 'phone':
        return this.sanitizePhone(value);
      case 'medicalText':
        return this.sanitizeMedicalText(value);
      case 'numeric':
        return this.sanitizeNumeric(value);
      case 'identifier':
        return this.sanitizeIdentifier(value);
      default:
        return this.sanitizeString(value);
    }
  }

  /**
   * Basic string sanitization
   */
  sanitizeString(value, options = {}) {
    if (!value || typeof value !== 'string') return '';

    const rules = { ...this.sanitizationRules.string, ...options };
    
    let sanitized = value;

    // Remove null bytes
    if (rules.removeNullBytes) {
      sanitized = sanitized.replace(/\0/g, '');
    }

    // Trim whitespace
    if (rules.trim) {
      sanitized = sanitized.trim();
    }

    // Escape HTML entities
    if (rules.escape) {
      sanitized = validator.escape(sanitized);
    }

    // Apply length limit
    if (rules.maxLength) {
      sanitized = sanitized.substring(0, rules.maxLength);
    }

    return sanitized;
  }

  /**
   * Mask name for partial display
   */
  maskName(name) {
    if (!name || typeof name !== 'string') return '***';
    
    const words = name.trim().split(' ');
    return words.map(word => {
      if (word.length <= 2) return word;
      return word.charAt(0) + '*'.repeat(word.length - 2) + word.charAt(word.length - 1);
    }).join(' ');
  }

  /**
   * Mask email for partial display
   */
  maskEmail(email) {
    if (!email || typeof email !== 'string') return '***@***.***';
    
    const [local, domain] = email.split('@');
    if (!local || !domain) return '***@***.***';
    
    const maskedLocal = local.length > 2 ? 
      local.charAt(0) + '*'.repeat(local.length - 2) + local.charAt(local.length - 1) : 
      '*'.repeat(local.length);
    
    const [domainName, tld] = domain.split('.');
    const maskedDomain = domainName.length > 2 ? 
      domainName.charAt(0) + '*'.repeat(domainName.length - 2) + domainName.charAt(domainName.length - 1) : 
      '*'.repeat(domainName.length);
    
    return `${maskedLocal}@${maskedDomain}.${tld}`;
  }

  /**
   * Mask phone number for partial display
   */
  maskPhone(phone) {
    if (!phone || typeof phone !== 'string') return '***-***-****';
    
    const digits = phone.replace(/\D/g, '');
    if (digits.length >= 10) {
      const lastFour = digits.slice(-4);
      return `***-***-${lastFour}`;
    }
    
    return '***-***-****';
  }

  /**
   * Mask address for partial display
   */
  maskAddress(address) {
    if (!address || typeof address !== 'string') return '*** ****';
    
    const words = address.trim().split(' ');
    if (words.length <= 2) return '*** ****';
    
    return words.slice(0, 1).join(' ') + ' ***';
  }

  /**
   * Mask ID for partial display
   */
  maskId(id) {
    if (!id || typeof id !== 'string') return '***';
    
    if (id.length <= 4) return '*'.repeat(id.length);
    
    return id.substring(0, 2) + '*'.repeat(id.length - 4) + id.substring(id.length - 2);
  }

  /**
   * Sanitize HTML content for medical documentation
   */
  sanitizeHTML(html, level = 'basic') {
    if (!html || typeof html !== 'string') return '';

    const config = this.allowedHTMLTags[level] || this.allowedHTMLTags.basic;
    
    try {
      return DOMPurify.sanitize(html, {
        ALLOWED_TAGS: config.tags,
        ALLOWED_ATTR: Object.keys(config.attributes),
        ALLOWED_URI_REGEXP: config.protocols.length > 0 ? 
          new RegExp(`^(${config.protocols.join('|')}):`, 'i') : 
          /^$/
      });
    } catch (error) {
      // If DOMPurify fails, strip all HTML
      return html.replace(/<[^>]*>/g, '');
    }
  }

  /**
   * Create sanitization middleware for Express
   */
  sanitizeMiddleware(sanitizationMap = {}) {
    return (req, res, next) => {
      try {
        // Sanitize request body
        if (req.body && typeof req.body === 'object') {
          req.body = this.sanitizeObject(req.body, sanitizationMap);
        }

        // Sanitize query parameters
        if (req.query && typeof req.query === 'object') {
          req.query = this.sanitizeObject(req.query, sanitizationMap);
        }

        // Sanitize route parameters
        if (req.params && typeof req.params === 'object') {
          req.params = this.sanitizeObject(req.params, sanitizationMap);
        }

        next();
      } catch (error) {
        next(error);
      }
    };
  }

  /**
   * Mask PHI data for logging
   */
  maskPHIForLogging(data, maskingLevel = 'full') {
    if (!data || typeof data !== 'object') return data;

    const masked = Array.isArray(data) ? [] : {};
    const rules = this.phiMaskingRules[maskingLevel];

    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase();
      let shouldMask = false;
      let maskingFunction = null;

      // Check if this field should be masked
      for (const [type, pattern] of Object.entries(this.phiMaskingRules.patterns)) {
        if (pattern.test(lowerKey)) {
          shouldMask = true;
          maskingFunction = maskingLevel === 'partial' ? rules[type] : null;
          break;
        }
      }

      if (shouldMask) {
        if (maskingLevel === 'full') {
          masked[key] = rules.name; // Use generic mask for full masking
        } else if (maskingFunction && typeof maskingFunction === 'function') {
          masked[key] = maskingFunction(value);
        } else {
          masked[key] = '***MASKED***';
        }
      } else if (typeof value === 'object' && value !== null) {
        masked[key] = this.maskPHIForLogging(value, maskingLevel);
      } else {
        masked[key] = value;
      }
    }

    return masked;
  }
}

module.exports = new DataSanitizers();