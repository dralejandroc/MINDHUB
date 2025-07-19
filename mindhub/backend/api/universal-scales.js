/**
 * ROUTER UNIVERSAL PARA ESCALAS
 * Integra los controladores universales con el servidor principal
 */

const express = require('express');
const router = express.Router();

// Import controllers
const scalesController = require('./scales-controller');
const assessmentController = require('./assessment-controller');

// Mount scale routes
router.use('/scales', scalesController);

// Mount assessment routes (sessions, administrations, assessments)
router.use('/sessions', assessmentController);
router.use('/administrations', assessmentController);
router.use('/assessments', assessmentController);
router.use('/patients', assessmentController);

module.exports = router;