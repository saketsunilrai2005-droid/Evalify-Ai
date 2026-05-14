import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { analyticsService } from '../services/analytics.service';
import { useQuota } from '../hooks/useQuota';
import Spinner from '../components/ui/Spinner';

const Analytics = () => {
  const navigate = useNavigate();
  const { plan, subscribed } = useQuota();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Gate: only professional+ plans
  const hasAccess = subscribed && (plan === 'professional' || plan === 'advanced');

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });

    analyticsService.getOverview()
      .then(d => setData(d))
      .catch(err => setError(err.response?.data?.error || 'Failed to load analytics'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center py-32">
        <Spinner size="lg" />
      </div>
    );
  }

  // Upgrade wall for free/starter users
  if (!hasAccess) {
    return (
      <div className="min-h-full flex items-center justify-center py-12">
        <div className="max-w-md text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-4xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
          </div>
          <h2 className="text-2xl font-black font-headline mb-3">Analytics Dashboard</h2>
          <p className="text-sm text-on-surface-variant mb-6 leading-relaxed">
            Unlock detailed performance analytics, score distributions, subject breakdowns and monthly trends with the <strong>Professional</strong> or <strong>Advanced</strong> plan.
          </p>
          <button
            onClick={() => navigate('/pricing')}
            className="px-8 py-3.5 bg-gradient-to-r from-primary to-primary-container text-white font-bold rounded-xl text-sm hover:shadow-xl hover:shadow-primary/20 active:scale-95 transition-all"
          >
            Upgrade Now
          </button>
          <p className="text-[10px] text-outline mt-4">Starting at ₹2,500/month</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-full flex items-center justify-center py-32">
        <div className="text-center">
          <span className="material-symbols-outlined text-error text-4xl mb-3 block">error</span>
          <p className="text-sm text-on-surface-variant">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { totalExams, completedExams, totalStudentsEvaluated, overallAverage, scoreDistribution, examPerformance, subjectBreakdown, recentActivity, monthlyTrend } = data;

  // Chart helpers
  const maxDistCount = Math.max(...scoreDistribution.map(d => d.count), 1);
  const maxTrendVal = Math.max(...monthlyTrend.map(t => Math.max(t.evaluations, t.exams)), 1);

  const getGradeColor = (pct) => {
    if (pct >= 80) return 'text-emerald-600 bg-emerald-50';
    if (pct >= 60) return 'text-blue-600 bg-blue-50';
    if (pct >= 40) return 'text-amber-600 bg-amber-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <div className="min-h-full relative">
      {/* Background blobs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[400px] -z-10 opacity-30 pointer-events-none">
        <div className="absolute top-[-80px] left-[5%] w-[300px] h-[300px] bg-primary/20 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute top-[50px] right-[10%] w-[250px] h-[250px] bg-secondary/20 rounded-full blur-[80px] animate-pulse delay-1000" />
      </div>

      {/* Header */}
      <div className="mb-8 sm:mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/60 backdrop-blur-md border border-white/40 shadow-sm mb-4">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Live Analytics</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black font-headline text-on-surface tracking-tighter mb-2 leading-tight">
          Analytics <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Dashboard</span>
        </h1>
        <p className="text-on-surface-variant text-xs sm:text-sm max-w-xl">
          Comprehensive performance insights across all your evaluations.
        </p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-5 mb-8 sm:mb-10">
        {[
          { label: 'Total Exams', value: totalExams, icon: 'menu_book', gradient: 'from-primary/10 to-primary/5', iconColor: 'text-primary' },
          { label: 'Completed', value: completedExams, icon: 'task_alt', gradient: 'from-emerald-500/10 to-emerald-500/5', iconColor: 'text-emerald-600' },
          { label: 'Students Evaluated', value: totalStudentsEvaluated, icon: 'people', gradient: 'from-secondary/10 to-secondary/5', iconColor: 'text-secondary' },
          { label: 'Avg Score', value: `${overallAverage}%`, icon: 'trending_up', gradient: 'from-amber-500/10 to-amber-500/5', iconColor: 'text-amber-600' },
        ].map(stat => (
          <div key={stat.label} className={`bg-gradient-to-br ${stat.gradient} backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-white/60 shadow-sm hover:-translate-y-0.5 transition-all`}>
            <div className="flex items-center gap-2 mb-3">
              <span className={`material-symbols-outlined text-lg ${stat.iconColor}`} style={{ fontVariationSettings: "'FILL' 1" }}>{stat.icon}</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{stat.label}</span>
            </div>
            <p className="text-2xl sm:text-3xl font-black font-headline text-on-surface">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 mb-8 sm:mb-10">

        {/* Score Distribution Bar Chart */}
        <div className="bg-white/80 backdrop-blur-2xl rounded-2xl p-5 sm:p-8 shadow-xl shadow-surface-container-highest/10 border border-white overflow-hidden">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>bar_chart</span>
            </div>
            <div>
              <h3 className="font-headline font-bold text-sm">Score Distribution</h3>
              <p className="text-[10px] text-on-surface-variant">Percentage-based buckets</p>
            </div>
          </div>
          <div className="space-y-3">
            {scoreDistribution.map((bucket) => (
              <div key={bucket.label} className="flex items-center gap-3">
                <span className="text-[10px] font-bold text-on-surface-variant w-14 text-right flex-shrink-0">{bucket.label}</span>
                <div className="flex-1 h-8 bg-surface-container-high/50 rounded-lg overflow-hidden relative">
                  <div
                    className="h-full rounded-lg bg-gradient-to-r from-primary to-primary-container transition-all duration-700 ease-out"
                    style={{ width: `${maxDistCount > 0 ? (bucket.count / maxDistCount) * 100 : 0}%`, minWidth: bucket.count > 0 ? '24px' : '0' }}
                  />
                  {bucket.count > 0 && (
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-on-surface-variant">{bucket.count}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
          {totalStudentsEvaluated === 0 && (
            <p className="text-center text-xs text-on-surface-variant mt-6">No evaluation data yet</p>
          )}
        </div>

        {/* Monthly Trend */}
        <div className="bg-white/80 backdrop-blur-2xl rounded-2xl p-5 sm:p-8 shadow-xl shadow-surface-container-highest/10 border border-white overflow-hidden">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-secondary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-secondary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>show_chart</span>
            </div>
            <div>
              <h3 className="font-headline font-bold text-sm">Monthly Trend</h3>
              <p className="text-[10px] text-on-surface-variant">Last 6 months</p>
            </div>
          </div>
          <div className="flex items-end gap-2 sm:gap-3 h-40">
            {monthlyTrend.map((m) => (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex flex-col items-center gap-1 h-32 justify-end">
                  {/* Evaluations bar */}
                  <div
                    className="w-full max-w-[28px] bg-gradient-to-t from-primary to-primary-container rounded-t-md transition-all duration-700"
                    style={{ height: `${maxTrendVal > 0 ? (m.evaluations / maxTrendVal) * 100 : 0}%`, minHeight: m.evaluations > 0 ? '8px' : '2px' }}
                    title={`${m.evaluations} evaluations`}
                  />
                </div>
                <span className="text-[9px] font-bold text-on-surface-variant">{m.month}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-4 justify-center">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm bg-primary" />
              <span className="text-[10px] font-bold text-on-surface-variant">Evaluations</span>
            </div>
          </div>
        </div>
      </div>

      {/* Exam Performance + Subject Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6 mb-8 sm:mb-10">

        {/* Exam Performance Table */}
        <div className="lg:col-span-2 bg-white/80 backdrop-blur-2xl rounded-2xl shadow-xl shadow-surface-container-highest/10 border border-white overflow-hidden">
          <div className="p-5 sm:p-8 border-b border-outline-variant/10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-emerald-600 text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>leaderboard</span>
              </div>
              <div>
                <h3 className="font-headline font-bold text-sm">Exam Performance</h3>
                <p className="text-[10px] text-on-surface-variant">Per-exam breakdown</p>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            {examPerformance.length > 0 ? (
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead>
                  <tr className="text-[10px] font-bold uppercase tracking-widest text-outline">
                    <th className="px-5 sm:px-8 py-3">Exam</th>
                    <th className="px-3 py-3">Students</th>
                    <th className="px-3 py-3">Avg</th>
                    <th className="px-3 py-3">High</th>
                    <th className="px-3 py-3">Low</th>
                    <th className="px-3 py-3">Pass Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {examPerformance.map(ep => (
                    <tr
                      key={ep.examId}
                      className="hover:bg-surface-container-low/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/exams/${ep.examId}`)}
                    >
                      <td className="px-5 sm:px-8 py-4">
                        <p className="font-semibold text-xs text-on-surface truncate max-w-[180px]">{ep.title}</p>
                        <p className="text-[10px] text-outline">{ep.subject}</p>
                      </td>
                      <td className="px-3 py-4 text-xs font-bold text-on-surface">{ep.students}</td>
                      <td className="px-3 py-4 text-xs font-bold text-primary">{ep.average}/{ep.totalMarks}</td>
                      <td className="px-3 py-4 text-xs font-bold text-emerald-600">{ep.highest}</td>
                      <td className="px-3 py-4 text-xs font-bold text-red-600">{ep.lowest}</td>
                      <td className="px-3 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${ep.passRate >= 70 ? 'bg-emerald-50 text-emerald-700' : ep.passRate >= 40 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>
                          {ep.passRate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="py-16 text-center">
                <span className="material-symbols-outlined text-outline text-3xl mb-2 block">assessment</span>
                <p className="text-xs text-on-surface-variant">No completed exams yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Subject Breakdown */}
        <div className="bg-white/80 backdrop-blur-2xl rounded-2xl p-5 sm:p-8 shadow-xl shadow-surface-container-highest/10 border border-white overflow-hidden">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-amber-600 text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>category</span>
            </div>
            <div>
              <h3 className="font-headline font-bold text-sm">By Subject</h3>
              <p className="text-[10px] text-on-surface-variant">Average performance</p>
            </div>
          </div>
          <div className="space-y-4">
            {subjectBreakdown.length > 0 ? subjectBreakdown.map(s => (
              <div key={s.subject} className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/10">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-bold text-xs text-on-surface">{s.subject}</p>
                    <p className="text-[10px] text-outline">{s.exams} exam{s.exams !== 1 ? 's' : ''} · {s.students} student{s.students !== 1 ? 's' : ''}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getGradeColor(s.average)}`}>
                    {s.average}%
                  </span>
                </div>
                <div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${s.average >= 70 ? 'bg-emerald-500' : s.average >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                    style={{ width: `${s.average}%` }}
                  />
                </div>
              </div>
            )) : (
              <div className="py-8 text-center">
                <span className="material-symbols-outlined text-outline text-3xl mb-2 block">school</span>
                <p className="text-xs text-on-surface-variant">No subject data yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white/80 backdrop-blur-2xl rounded-2xl shadow-xl shadow-surface-container-highest/10 border border-white overflow-hidden">
        <div className="p-5 sm:p-8 border-b border-outline-variant/10 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>history</span>
          </div>
          <div>
            <h3 className="font-headline font-bold text-sm">Recent Evaluations</h3>
            <p className="text-[10px] text-on-surface-variant">Last 10 evaluations</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          {recentActivity.length > 0 ? (
            <table className="w-full text-left border-collapse min-w-[400px]">
              <thead>
                <tr className="text-[10px] font-bold uppercase tracking-widest text-outline">
                  <th className="px-5 sm:px-8 py-3">Student</th>
                  <th className="px-3 py-3 hidden sm:table-cell">Roll No</th>
                  <th className="px-3 py-3">Score</th>
                  <th className="px-3 py-3">Percentage</th>
                  <th className="px-3 py-3 hidden md:table-cell">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {recentActivity.map((r, idx) => (
                  <tr key={idx} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="px-5 sm:px-8 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px] flex-shrink-0">
                          {(r.studentName || 'S')[0]}
                        </div>
                        <span className="font-semibold text-xs text-on-surface truncate max-w-[120px]">{r.studentName}</span>
                      </div>
                    </td>
                    <td className="px-3 py-4 text-xs text-on-surface-variant hidden sm:table-cell">{r.rollNumber}</td>
                    <td className="px-3 py-4">
                      <span className="text-xs font-bold text-on-surface">{r.marks}</span>
                      <span className="text-[10px] text-outline">/{r.maxMarks}</span>
                    </td>
                    <td className="px-3 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-14 h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${r.percentage >= 70 ? 'bg-emerald-500' : r.percentage >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                            style={{ width: `${r.percentage}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-on-surface">{r.percentage}%</span>
                      </div>
                    </td>
                    <td className="px-3 py-4 text-[10px] text-on-surface-variant hidden md:table-cell">
                      {new Date(r.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-16 text-center">
              <span className="material-symbols-outlined text-outline text-3xl mb-2 block">history</span>
              <p className="text-xs text-on-surface-variant">No recent evaluations</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
