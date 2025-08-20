require('dotenv').config();

// Prueba diferentes configuraciones de Zoho
const nodemailer = require('nodemailer');

async function testZohoConfigs() {
  console.log('🧪 Probando diferentes configuraciones de Zoho...');
  
  const configs = [
    {
      name: 'Zoho Preset',
      config: {
        service: 'Zoho',
        auth: {
          user: process.env.ZOHO_EMAIL,
          pass: process.env.ZOHO_PASSWORD
        }
      }
    },
    {
      name: 'SMTP Pro - Port 465',
      config: {
        host: 'smtppro.zoho.com',
        port: 465,
        secure: true,
        auth: {
          user: process.env.ZOHO_EMAIL,
          pass: process.env.ZOHO_PASSWORD
        }
      }
    },
    {
      name: 'SMTP Pro - Port 587',
      config: {
        host: 'smtppro.zoho.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.ZOHO_EMAIL,
          pass: process.env.ZOHO_PASSWORD
        }
      }
    },
    {
      name: 'SMTP Regular - Port 587',
      config: {
        host: 'smtp.zoho.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.ZOHO_EMAIL,
          pass: process.env.ZOHO_PASSWORD
        }
      }
    }
  ];

  for (const { name, config } of configs) {
    try {
      console.log(`\n📧 Probando: ${name}`);
      const transporter = nodemailer.createTransporter(config);
      
      await transporter.verify();
      console.log(`✅ ${name} - Conexión exitosa`);
      
      // Si la conexión funciona, enviar email de prueba
      const info = await transporter.sendMail({
        from: 'info@mindhub.cloud',
        to: process.env.ZOHO_EMAIL,
        subject: `Test: ${name}`,
        text: `Email de prueba usando configuración: ${name}`
      });
      
      console.log(`📬 ${name} - Email enviado: ${info.messageId}`);
      console.log(`🎉 ¡${name} FUNCIONA! Usa esta configuración.`);
      break; // Si funciona, no probar más
      
    } catch (error) {
      console.log(`❌ ${name} - Error: ${error.message}`);
    }
  }
}

// Verificar variables de entorno
if (!process.env.ZOHO_EMAIL || !process.env.ZOHO_PASSWORD) {
  console.log('❌ Faltan variables de entorno:');
  console.log('ZOHO_EMAIL=drcontreras@mindhub.cloud');
  console.log('ZOHO_PASSWORD=53AlfaCoca.');
} else {
  testZohoConfigs().catch(console.error);
}