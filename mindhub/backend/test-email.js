require('dotenv').config();
const emailService = require('./services/EmailServiceZoho');

async function testEmail() {
  console.log('🧪 Probando conexión con Zoho Mail...');
  
  // Test 1: Verificar conexión
  const connectionOk = await emailService.verifyConnection();
  if (!connectionOk) {
    console.log('❌ Error de conexión con Zoho');
    return;
  }
  console.log('✅ Conexión con Zoho exitosa');

  // Test 2: Enviar email de prueba
  console.log('📧 Enviando email de prueba...');
  
  const testResult = await emailService.sendMail({
    from: 'MindHub <info@mindhub.cloud>',
    to: 'drcontreras@mindhub.cloud', // Tu email
    subject: '🎉 Test Email - MindHub funcionando',
    html: `
      <h2>¡Email de prueba exitoso!</h2>
      <p>Si recibes este email, significa que:</p>
      <ul>
        <li>✅ Zoho Mail está configurado correctamente</li>
        <li>✅ Los aliases funcionan</li>
        <li>✅ El backend puede enviar emails</li>
      </ul>
      <p>Enviado desde: <strong>info@mindhub.cloud</strong></p>
      <p>Fecha: ${new Date().toLocaleString('es-MX')}</p>
    `
  });

  if (testResult.success) {
    console.log('✅ Email de prueba enviado exitosamente');
    console.log('📬 Revisa tu buzón en drcontreras@mindhub.cloud');
  } else {
    console.log('❌ Error enviando email de prueba:', testResult.error);
  }
}

testEmail().catch(console.error);