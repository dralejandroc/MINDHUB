const express = require('express');
const router = express.Router();
const emailService = require('../services/EmailService');

// POST /api/feedback
router.post('/', async (req, res) => {
  try {
    const { email, subject, message, type = 'general' } = req.body;

    // Validate inputs
    if (!email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Email, asunto y mensaje son requeridos'
      });
    }

    // Send feedback notification
    const result = await emailService.sendFeedbackNotification(
      email,
      subject,
      message
    );

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Error al enviar feedback'
      });
    }

    res.json({
      success: true,
      message: 'Feedback enviado exitosamente'
    });
  } catch (error) {
    console.error('Feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;