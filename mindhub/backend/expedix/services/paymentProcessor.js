const crypto = require('crypto');

class PaymentProcessorService {
  constructor() {
    this.paymentMethods = ['card', 'transfer', 'cash'];
    this.pendingPayments = new Map();
    this.completedPayments = new Map();
  }

  // Crear intent de pago
  async createPaymentIntent(data) {
    const { invitationId, amount, patientId, description } = data;
    
    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const expirationTime = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

    const paymentIntent = {
      id: paymentId,
      invitationId,
      patientId,
      amount,
      currency: 'MXN',
      description: description || 'Anticipo para cita médica',
      status: 'pending',
      paymentMethods: this.paymentMethods,
      expirationTime: expirationTime.toISOString(),
      createdAt: new Date().toISOString(),
      clientSecret: this.generateClientSecret(paymentId),
      metadata: {
        type: 'appointment_advance',
        invitationId
      }
    };

    this.pendingPayments.set(paymentId, paymentIntent);

    return {
      success: true,
      data: paymentIntent
    };
  }

  // Confirmar pago manual (transferencia, efectivo)
  async confirmManualPayment(paymentId, data) {
    const { method, reference, notes, confirmedBy } = data;

    if (!this.pendingPayments.has(paymentId)) {
      return {
        success: false,
        message: 'Payment intent not found'
      };
    }

    const payment = this.pendingPayments.get(paymentId);
    
    // Verificar expiración
    if (new Date() > new Date(payment.expirationTime)) {
      payment.status = 'expired';
      return {
        success: false,
        message: 'Payment intent has expired'
      };
    }

    // Confirmar pago
    const confirmedPayment = {
      ...payment,
      status: 'completed',
      paymentMethod: method,
      reference: reference || null,
      notes: notes || '',
      confirmedBy: confirmedBy || 'system',
      confirmedAt: new Date().toISOString(),
      transaction: {
        id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        method,
        reference,
        amount: payment.amount,
        timestamp: new Date().toISOString()
      }
    };

    this.pendingPayments.delete(paymentId);
    this.completedPayments.set(paymentId, confirmedPayment);

    return {
      success: true,
      data: confirmedPayment
    };
  }

  // Procesar pago con tarjeta (simulado)
  async processCardPayment(paymentId, cardData) {
    if (!this.pendingPayments.has(paymentId)) {
      return {
        success: false,
        message: 'Payment intent not found'
      };
    }

    const payment = this.pendingPayments.get(paymentId);
    
    // Verificar expiración
    if (new Date() > new Date(payment.expirationTime)) {
      payment.status = 'expired';
      return {
        success: false,
        message: 'Payment intent has expired'
      };
    }

    // Simular procesamiento de tarjeta
    const isSuccessful = await this.simulateCardProcessing(cardData);
    
    if (!isSuccessful) {
      return {
        success: false,
        message: 'Card payment failed',
        error: 'Payment declined by bank'
      };
    }

    const confirmedPayment = {
      ...payment,
      status: 'completed',
      paymentMethod: 'card',
      confirmedAt: new Date().toISOString(),
      transaction: {
        id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        method: 'card',
        last4: cardData.number.slice(-4),
        brand: this.detectCardBrand(cardData.number),
        amount: payment.amount,
        timestamp: new Date().toISOString()
      }
    };

    this.pendingPayments.delete(paymentId);
    this.completedPayments.set(paymentId, confirmedPayment);

    return {
      success: true,
      data: confirmedPayment
    };
  }

  // Obtener estado de pago
  async getPaymentStatus(paymentId) {
    // Buscar en pagos pendientes
    if (this.pendingPayments.has(paymentId)) {
      const payment = this.pendingPayments.get(paymentId);
      
      // Verificar si expiró
      if (new Date() > new Date(payment.expirationTime)) {
        payment.status = 'expired';
        this.pendingPayments.set(paymentId, payment);
      }
      
      return {
        success: true,
        data: payment
      };
    }

    // Buscar en pagos completados
    if (this.completedPayments.has(paymentId)) {
      return {
        success: true,
        data: this.completedPayments.get(paymentId)
      };
    }

    return {
      success: false,
      message: 'Payment not found'
    };
  }

  // Cancelar pago
  async cancelPayment(paymentId, reason) {
    if (!this.pendingPayments.has(paymentId)) {
      return {
        success: false,
        message: 'Payment intent not found'
      };
    }

    const payment = this.pendingPayments.get(paymentId);
    payment.status = 'cancelled';
    payment.cancelledAt = new Date().toISOString();
    payment.cancellationReason = reason || 'Cancelled by user';

    this.pendingPayments.set(paymentId, payment);

    return {
      success: true,
      data: payment
    };
  }

  // Obtener historial de pagos por paciente
  async getPatientPaymentHistory(patientId) {
    const allPayments = [
      ...Array.from(this.pendingPayments.values()),
      ...Array.from(this.completedPayments.values())
    ];

    const patientPayments = allPayments
      .filter(payment => payment.patientId === patientId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return {
      success: true,
      data: patientPayments,
      total: patientPayments.length
    };
  }

  // Estadísticas de pagos
  async getPaymentStats(startDate, endDate) {
    const allPayments = [
      ...Array.from(this.pendingPayments.values()),
      ...Array.from(this.completedPayments.values())
    ];

    let filteredPayments = allPayments;
    
    if (startDate) {
      filteredPayments = filteredPayments.filter(
        payment => new Date(payment.createdAt) >= new Date(startDate)
      );
    }
    
    if (endDate) {
      filteredPayments = filteredPayments.filter(
        payment => new Date(payment.createdAt) <= new Date(endDate)
      );
    }

    const stats = {
      total: filteredPayments.length,
      completed: filteredPayments.filter(p => p.status === 'completed').length,
      pending: filteredPayments.filter(p => p.status === 'pending').length,
      expired: filteredPayments.filter(p => p.status === 'expired').length,
      cancelled: filteredPayments.filter(p => p.status === 'cancelled').length,
      totalAmount: filteredPayments
        .filter(p => p.status === 'completed')
        .reduce((sum, p) => sum + p.amount, 0),
      averageAmount: 0,
      paymentMethods: {
        card: filteredPayments.filter(p => p.paymentMethod === 'card').length,
        transfer: filteredPayments.filter(p => p.paymentMethod === 'transfer').length,
        cash: filteredPayments.filter(p => p.paymentMethod === 'cash').length
      }
    };

    const completedPayments = filteredPayments.filter(p => p.status === 'completed');
    if (completedPayments.length > 0) {
      stats.averageAmount = Math.round(stats.totalAmount / completedPayments.length);
    }

    return {
      success: true,
      data: stats
    };
  }

  // Reembolsar pago
  async refundPayment(paymentId, amount, reason) {
    if (!this.completedPayments.has(paymentId)) {
      return {
        success: false,
        message: 'Completed payment not found'
      };
    }

    const payment = this.completedPayments.get(paymentId);
    
    if (amount > payment.amount) {
      return {
        success: false,
        message: 'Refund amount cannot exceed original payment amount'
      };
    }

    const refundId = `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const refund = {
      id: refundId,
      paymentId,
      amount: amount || payment.amount,
      reason: reason || 'Refund requested',
      status: 'completed',
      createdAt: new Date().toISOString()
    };

    // Agregar refund al pago original
    if (!payment.refunds) {
      payment.refunds = [];
    }
    payment.refunds.push(refund);

    // Calcular monto neto
    const totalRefunded = payment.refunds.reduce((sum, ref) => sum + ref.amount, 0);
    payment.netAmount = payment.amount - totalRefunded;
    
    if (payment.netAmount <= 0) {
      payment.status = 'refunded';
    } else {
      payment.status = 'partially_refunded';
    }

    this.completedPayments.set(paymentId, payment);

    return {
      success: true,
      data: refund
    };
  }

  // Métodos auxiliares
  generateClientSecret(paymentId) {
    return crypto
      .createHash('sha256')
      .update(`${paymentId}_${process.env.PAYMENT_SECRET_KEY || 'default_secret'}`)
      .digest('hex');
  }

  async simulateCardProcessing(cardData) {
    // Simular tiempo de procesamiento
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simular 95% de éxito
    return Math.random() > 0.05;
  }

  detectCardBrand(cardNumber) {
    const number = cardNumber.replace(/\s/g, '');
    
    if (number.match(/^4/)) return 'visa';
    if (number.match(/^5[1-5]/)) return 'mastercard';
    if (number.match(/^3[47]/)) return 'amex';
    if (number.match(/^6/)) return 'discover';
    
    return 'unknown';
  }

  // Limpiar pagos expirados
  cleanupExpiredPayments() {
    const now = new Date();
    
    for (const [paymentId, payment] of this.pendingPayments) {
      if (now > new Date(payment.expirationTime)) {
        payment.status = 'expired';
        payment.expiredAt = now.toISOString();
        this.pendingPayments.set(paymentId, payment);
      }
    }
  }

  // Obtener URL de pago para el frontend
  getPaymentUrl(paymentId) {
    return `${process.env.FRONTEND_URL}/payment/${paymentId}`;
  }
}

// Singleton instance
let processorInstance = null;

function getPaymentProcessor() {
  if (!processorInstance) {
    processorInstance = new PaymentProcessorService();
  }
  return processorInstance;
}

module.exports = {
  PaymentProcessorService,
  getPaymentProcessor
};