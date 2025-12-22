// Script para generar JWT de test válido para la arquitectura simplificada
const crypto = require('crypto');

// Datos del usuario de prueba (Dr. Aleks)
const payload = {
  sub: 'a1c193e9-643a-4ba9-9214-29536ea93913',
  email: 'dr_aleks_c@hotmail.com',
  role: 'authenticated',
  iss: 'supabase',
  aud: 'authenticated',
  exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hora de validez
  iat: Math.floor(Date.now() / 1000)
};

// JWT Secret del .env.local (el mismo que usa Django)
const JWT_SECRET = 'CxqGEm1Cpk1tKY5GPTxn+n0ywlE5B2y4B6a00S3ZbFMnP/pgYLa9FPNDoPanAn0w7XIdGP5o7yFV9XhR2oVEmw==';

// Función simple para generar JWT
function base64urlEncode(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function generateJWT(payload, secret) {
  // Header
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  // Encode header and payload
  const encodedHeader = base64urlEncode(JSON.stringify(header));
  const encodedPayload = base64urlEncode(JSON.stringify(payload));
  
  // Create signature
  const data = encodedHeader + '.' + encodedPayload;
  const signature = crypto
    .createHmac('sha256', Buffer.from(JWT_SECRET, 'base64'))
    .update(data)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
  
  return data + '.' + signature;
}

const testJWT = generateJWT(payload, JWT_SECRET);

console.log('🔑 JWT Token generado para test:');
console.log(testJWT);
console.log('\n📋 Para usar en curl:');
console.log(`curl -H "Authorization: Bearer ${testJWT}" http://localhost:8002/api/expedix/patients/`);

// Verificar que el token funciona
console.log('\n🧪 Datos del payload:');
console.log('User ID:', payload.sub);
console.log('Email:', payload.email);
console.log('Expires:', new Date(payload.exp * 1000).toLocaleString());