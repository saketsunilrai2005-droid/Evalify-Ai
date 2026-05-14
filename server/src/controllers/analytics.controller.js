const ResultModel = require('../models/result.model');
const ExamModel = require('../models/exam.model');
const supabase = require('../config/supabase');
const logger = require('../utils/logger');

/**
 * GET /api/analytics/overview
 * Aggregate analytics across all user's exams.
 */
async function getOverview(req, res, next) {
  try {
    const userId = req.user.id;

    // Get all exams by user
    const { data: exams, error: examErr } = await supabase
      .from('exams')
      .select('id, title, subject, total_marks, status, created_at')
      .eq('created_by', userId)
      .order('created_at', { ascending: false });

    if (examErr) throw examErr;
    if (!exams || exams.length === 0) {
      return res.json({
        totalExams: 0,
        completedExams: 0,
        totalStudentsEvaluated: 0,
        overallAverage: 0,
        scoreDistribution: [],
        examPerformance: [],
        subjectBreakdown: [],
        recentActivity: [],
        monthlyTrend: [],
      });
    }

    const examIds = exams.map(e => e.id);
    const completedExams = exams.filter(e => e.status === 'completed');

    // Get all results for user's exams
    const { data: results, error: resErr } = await supabase
      .from('results')
      .select('id, exam_id, total_marks_awarded, total_max_marks, created_at, students(name, roll_number)')
      .in('exam_id', examIds)
      .order('created_at', { ascending: false });

    if (resErr) throw resErr;
    const allResults = results || [];

    // --- Overall stats ---
    const totalStudentsEvaluated = allResults.length;
    const allPercentages = allResults
      .filter(r => r.total_max_marks > 0)
      .map(r => (r.total_marks_awarded / r.total_max_marks) * 100);
    const overallAverage = allPercentages.length > 0
      ? allPercentages.reduce((a, b) => a + b, 0) / allPercentages.length
      : 0;

    // --- Score distribution (buckets: 0-20, 20-40, 40-60, 60-80, 80-100) ---
    const buckets = [
      { label: '0-20%', min: 0, max: 20, count: 0 },
      { label: '20-40%', min: 20, max: 40, count: 0 },
      { label: '40-60%', min: 40, max: 60, count: 0 },
      { label: '60-80%', min: 60, max: 80, count: 0 },
      { label: '80-100%', min: 80, max: 101, count: 0 },
    ];
    allPercentages.forEach(pct => {
      const bucket = buckets.find(b => pct >= b.min && pct < b.max);
      if (bucket) bucket.count++;
    });
    const scoreDistribution = buckets.map(b => ({ label: b.label, count: b.count }));

    // --- Per-exam performance ---
    const examPerformance = completedExams.map(exam => {
      const examResults = allResults.filter(r => r.exam_id === exam.id);
      const marks = examResults.map(r => r.total_marks_awarded);
      const avg = marks.length > 0 ? marks.reduce((a, b) => a + b, 0) / marks.length : 0;
      const highest = marks.length > 0 ? Math.max(...marks) : 0;
      const lowest = marks.length > 0 ? Math.min(...marks) : 0;
      const passCount = examResults.filter(r => r.total_max_marks > 0 && (r.total_marks_awarded / r.total_max_marks) >= 0.4).length;
      return {
        examId: exam.id,
        title: exam.title,
        subject: exam.subject,
        totalMarks: exam.total_marks,
        students: examResults.length,
        average: Math.round(avg * 10) / 10,
        highest,
        lowest,
        passRate: examResults.length > 0 ? Math.round((passCount / examResults.length) * 100) : 0,
        date: exam.created_at,
      };
    });

    // --- Subject breakdown ---
    const subjectMap = {};
    completedExams.forEach(exam => {
      const sub = exam.subject || 'Other';
      if (!subjectMap[sub]) subjectMap[sub] = { subject: sub, exams: 0, students: 0, totalPct: 0 };
      subjectMap[sub].exams++;
      const examResults = allResults.filter(r => r.exam_id === exam.id);
      subjectMap[sub].students += examResults.length;
      examResults.forEach(r => {
        if (r.total_max_marks > 0) {
          subjectMap[sub].totalPct += (r.total_marks_awarded / r.total_max_marks) * 100;
        }
      });
    });
    const subjectBreakdown = Object.values(subjectMap).map(s => ({
      subject: s.subject,
      exams: s.exams,
      students: s.students,
      average: s.students > 0 ? Math.round(s.totalPct / s.students) : 0,
    }));

    // --- Monthly trend (last 6 months) ---
    const monthlyTrend = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthLabel = d.toLocaleString('default', { month: 'short', year: '2-digit' });
      const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      const monthResults = allResults.filter(r => {
        const rDate = new Date(r.created_at);
        return rDate >= monthStart && rDate < monthEnd;
      });
      const monthExams = exams.filter(e => {
        const eDate = new Date(e.created_at);
        return eDate >= monthStart && eDate < monthEnd;
      });
      monthlyTrend.push({
        month: monthLabel,
        evaluations: monthResults.length,
        exams: monthExams.length,
      });
    }

    // --- Recent activity (last 10) ---
    const recentActivity = allResults.slice(0, 10).map(r => ({
      studentName: r.students?.name || 'Unknown',
      rollNumber: r.students?.roll_number || 'N/A',
      marks: r.total_marks_awarded,
      maxMarks: r.total_max_marks,
      percentage: r.total_max_marks > 0 ? Math.round((r.total_marks_awarded / r.total_max_marks) * 100) : 0,
      date: r.created_at,
      examId: r.exam_id,
    }));

    res.json({
      totalExams: exams.length,
      completedExams: completedExams.length,
      totalStudentsEvaluated,
      overallAverage: Math.round(overallAverage * 10) / 10,
      scoreDistribution,
      examPerformance,
      subjectBreakdown,
      recentActivity,
      monthlyTrend,
    });
  } catch (err) {
    logger.error('Analytics overview error:', err.message);
    next(err);
  }
}

module.exports = { getOverview };
