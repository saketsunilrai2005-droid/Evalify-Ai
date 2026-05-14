const { Router } = require('express');
const { getOverview } = require('../controllers/analytics.controller');
const { authenticate } = require('../middleware/auth');

const router = Router();

// All analytics routes require authentication
router.use(authenticate);

router.get('/overview', getOverview);

module.exports = router;
