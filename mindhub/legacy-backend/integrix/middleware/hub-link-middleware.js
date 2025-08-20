const tokenService = require('../services/token-service');
const auditLogger = require('../../shared/utils/audit-logger');

class HubLinkMiddleware {
    validateHubLinkToken(req, res, next) {
        try {
            const authHeader = req.headers.authorization;
            
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({
                    success: false,
                    error: 'Missing or invalid authorization header'
                });
            }

            const token = authHeader.substring(7);
            const verification = tokenService.verifyHubLinkToken(token);

            if (!verification.valid) {
                return res.status(401).json({
                    success: false,
                    error: `Token validation failed: ${verification.error}`
                });
            }

            // Agregar datos del token al request
            req.hubLink = {
                userId: verification.payload.sub,
                sourceHub: verification.payload.source_hub,
                targetHub: verification.payload.target_hub,
                operation: verification.payload.operation,
                entityId: verification.payload.entity_id,
                permissions: verification.payload.permissions,
                tokenId: verification.payload.jti
            };

            // Log de la operación inter-hub
            auditLogger.logHubInteraction({
                tokenId: verification.payload.jti,
                userId: verification.payload.sub,
                sourceHub: verification.payload.source_hub,
                targetHub: verification.payload.target_hub,
                operation: verification.payload.operation,
                entityId: verification.payload.entity_id,
                ipAddress: req.ip,
                userAgent: req.get('User-Agent')
            });

            next();
        } catch (error) {
            console.error('Hub link middleware error:', error);
            return res.status(500).json({
                success: false,
                error: 'Internal server error during token validation'
            });
        }
    }

    requirePermission(permission) {
        return (req, res, next) => {
            if (!req.hubLink) {
                return res.status(401).json({
                    success: false,
                    error: 'Hub link authentication required'
                });
            }

            if (!req.hubLink.permissions.includes(permission)) {
                auditLogger.logUnauthorizedAccess({
                    userId: req.hubLink.userId,
                    requiredPermission: permission,
                    userPermissions: req.hubLink.permissions,
                    operation: req.hubLink.operation,
                    ipAddress: req.ip
                });

                return res.status(403).json({
                    success: false,
                    error: `Insufficient permissions. Required: ${permission}`
                });
            }

            next();
        };
    }

    validateHubAccess(allowedSourceHubs = [], allowedTargetHubs = []) {
        return (req, res, next) => {
            if (!req.hubLink) {
                return res.status(401).json({
                    success: false,
                    error: 'Hub link authentication required'
                });
            }

            const { sourceHub, targetHub } = req.hubLink;

            // Validar hub origen si se especifica
            if (allowedSourceHubs.length > 0 && !allowedSourceHubs.includes(sourceHub)) {
                return res.status(403).json({
                    success: false,
                    error: `Source hub '${sourceHub}' not allowed for this operation`
                });
            }

            // Validar hub destino si se especifica
            if (allowedTargetHubs.length > 0 && !allowedTargetHubs.includes(targetHub)) {
                return res.status(403).json({
                    success: false,
                    error: `Target hub '${targetHub}' not allowed for this operation`
                });
            }

            next();
        };
    }

    validateOperation(allowedOperations = []) {
        return (req, res, next) => {
            if (!req.hubLink) {
                return res.status(401).json({
                    success: false,
                    error: 'Hub link authentication required'
                });
            }

            if (allowedOperations.length > 0 && !allowedOperations.includes(req.hubLink.operation)) {
                return res.status(403).json({
                    success: false,
                    error: `Operation '${req.hubLink.operation}' not allowed for this endpoint`
                });
            }

            next();
        };
    }

    transformRequestData(transformFn) {
        return (req, res, next) => {
            try {
                if (req.body && typeof transformFn === 'function') {
                    req.body = transformFn(req.body, req.hubLink);
                }
                next();
            } catch (error) {
                console.error('Request transformation error:', error);
                return res.status(400).json({
                    success: false,
                    error: 'Data transformation failed'
                });
            }
        };
    }

    transformResponseData(transformFn) {
        return (req, res, next) => {
            // Interceptar el método json de response
            const originalJson = res.json;
            
            res.json = function(data) {
                try {
                    if (typeof transformFn === 'function') {
                        data = transformFn(data, req.hubLink);
                    }
                    originalJson.call(this, data);
                } catch (error) {
                    console.error('Response transformation error:', error);
                    originalJson.call(this, {
                        success: false,
                        error: 'Response transformation failed'
                    });
                }
            };
            
            next();
        };
    }

    logHubInteraction(req, res, next) {
        // Log detallado de la interacción
        const startTime = Date.now();
        
        // Interceptar la respuesta para log completo
        const originalSend = res.send;
        res.send = function(data) {
            const duration = Date.now() - startTime;
            
            auditLogger.logHubInteractionComplete({
                tokenId: req.hubLink?.tokenId,
                userId: req.hubLink?.userId,
                sourceHub: req.hubLink?.sourceHub,
                targetHub: req.hubLink?.targetHub,
                operation: req.hubLink?.operation,
                entityId: req.hubLink?.entityId,
                method: req.method,
                path: req.path,
                statusCode: res.statusCode,
                duration,
                requestSize: JSON.stringify(req.body || {}).length,
                responseSize: typeof data === 'string' ? data.length : JSON.stringify(data).length,
                ipAddress: req.ip,
                userAgent: req.get('User-Agent')
            });

            originalSend.call(this, data);
        };
        
        next();
    }
}

module.exports = new HubLinkMiddleware();