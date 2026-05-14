const EvaluationService = require('../services/evaluationService');
const EvaluationModel = require('../models/evaluation.model');
const QuotaModel = require('../models/quota.model');
const logger = require('../utils/logger');

/**
 * POST /api/evaluate
 * Upload answer sheets and start evaluation.
 */
async function startEvaluation(req, res, next) {
  try {
    const { examId } = req.body;

    if (!examId) {
      return res.status(400).json({ error: 'examId is required' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'At least one answer sheet file is required' });
    }

    // Check quota (daily for free, monthly for paid)
    const quota = await QuotaModel.checkQuota(req.user.id);
    if (!quota.allowed) {
      const periodLabel = quota.isMonthly ? 'this month' : 'today';
      return res.status(403).json({
        error: 'Evaluation limit reached',
        message: `You have used all ${quota.limit} evaluations ${periodLabel}. Upgrade your plan for more.`,
        quota,
      });
    }

    logger.info(`Starting evaluation for exam ${examId} with ${req.files.length} answer sheets`);

    // Process in background - do not await
    EvaluationService.processBatch(examId, req.files)
      .then(result => {
        logger.info(`Batch evaluation complete for exam ${examId}`, result);
      })
      .catch(err => {
        logger.error(`Batch evaluation failed for exam ${examId}: ${err.message}`, {
          error: err.message,
          stack: err.stack,
          examId,
        });
      });
    
    res.json({
      message: 'Evaluation started',
      examId,
      status: 'processing'
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/evaluate/status/:examId
 * Get evaluation progress for an exam.
 */
async function getEvaluationStatus(req, res, next) {
  try {
    const { examId } = req.params;

    const counts = await EvaluationModel.countByStatus(examId);
    const evaluations = await EvaluationModel.findByExam(examId);

    res.json({
      examId,
      counts,
      total: evaluations.length,
      evaluations: evaluations.map((e) => ({
        id: e.id,
        studentName: e.students?.name || 'Unknown',
        rollNumber: e.students?.roll_number || 'N/A',
        status: e.status,
        marksAwarded: e.total_marks_awarded,
        evaluatedAt: e.evaluated_at,
      })),
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { startEvaluation, getEvaluationStatus };
