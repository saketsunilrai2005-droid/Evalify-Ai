const { Router } = require('express');
const authRoutes = require('./auth.routes');
const examRoutes = require('./exam.routes');
const evaluateRoutes = require('./evaluate.routes');
const resultsRoutes = require('./results.routes');
const quotaRoutes = require('./quota.routes');
const GeminiService = require('../services/geminiService');
const logger = require('../utils/logger');

const router = Router();

router.use('/auth', authRoutes);
router.use('/exams', examRoutes);
router.use('/evaluate', evaluateRoutes);
router.use('/results', resultsRoutes);
router.use('/quota', quotaRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Gemini API health check
router.get('/health/gemini', async (req, res, next) => {
  try {
    const testPrompt = 'Hello, respond with "OK" if you can read this.';
    const response = await GeminiService.evaluate(testPrompt, []);
    logger.info('Gemini API health check passed');
    res.json({ 
      status: 'ok', 
      gemini: true,
      response: response.substring(0, 100)
    });
  } catch (err) {
    logger.error('Gemini API health check failed', { error: err.message });
    res.status(500).json({ 
      status: 'error', 
      gemini: false,
      error: err.message 
    });
  }
});

module.exports = router;
