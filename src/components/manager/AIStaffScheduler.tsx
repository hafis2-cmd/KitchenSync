import React, { useState, useEffect } from 'react';
import { Sparkles, Users, Calendar, Clock, RefreshCw, AlertCircle, CheckCircle2, TrendingUp, ShieldCheck } from 'lucide-react';

interface RecommendedShift {
  shiftName: string;
  timeRange: string;
  predictedVolume: string;
  recommendedWaiters: number;
  recommendedChefs: number;
  rationale: string;
}

interface ScheduleData {
  summary: string;
  recommendedShifts: RecommendedShift[];
  laborCostEfficiencyScore: number;
  optimizationTips: string[];
}

export const AIStaffScheduler: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [isFallback, setIsFallback] = useState(false);
  const [scheduleData, setScheduleData] = useState<ScheduleData | null>(null);
  const [applied, setApplied] = useState(false);

  const fetchSchedule = async () => {
    setLoading(true);
    setApplied(false);
    try {
      const res = await fetch('/api/ai/scheduler', { method: 'POST' });
      const data = await res.json();
      if (data.success && data.schedule) {
        setScheduleData(data.schedule);
        setIsFallback(!!data.isFallback);
      }
    } catch (err) {
      console.error('Failed to fetch AI staff schedule:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, []);

  return (
    <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 sm:p-8 border border-indigo-800 shadow-xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-indigo-800/60 pb-5">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Gemini 3.6 Flash Operations Intelligence</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            AI Demand-Driven Staff Scheduler
          </h2>
          <p className="text-xs text-indigo-200/80">
            Analyzes historical guest turnover and live order volume to suggest optimal waiter & chef staffing levels per shift.
          </p>
        </div>

        <button
          onClick={fetchSchedule}
          disabled={loading}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 shrink-0 border border-indigo-400/30"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Analyzing Demand...' : 'Recalculate Shift Demand'}
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center space-y-3">
          <RefreshCw className="w-8 h-8 mx-auto animate-spin text-indigo-400" />
          <p className="text-xs font-semibold text-indigo-200">
            Synthesizing historical hourly order volume & shift efficiency metrics...
          </p>
        </div>
      ) : scheduleData ? (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Executive Overview Banner */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-3 p-4 rounded-xl bg-white/5 border border-indigo-500/30 backdrop-blur-xs space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> AI Executive Recommendation
              </span>
              <p className="text-xs sm:text-sm text-indigo-100 leading-relaxed font-sans font-medium">
                {scheduleData.summary}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-indigo-900/40 border border-indigo-500/30 flex flex-col justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">
                Labor Efficiency Score
              </span>
              <div className="flex items-baseline gap-2 my-1">
                <span className="text-3xl font-black font-mono text-emerald-400">
                  {scheduleData.laborCostEfficiencyScore}
                </span>
                <span className="text-xs text-indigo-300">/ 100</span>
              </div>
              <span className="text-[10px] text-indigo-300">Optimal labor-to-sales ratio</span>
            </div>
          </div>

          {/* Recommended Shift Cards */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-400" /> Recommended Staff Allocations
              </h3>
              {isFallback && (
                <span className="text-[10px] font-mono text-amber-300 bg-amber-950/60 border border-amber-800 px-2 py-0.5 rounded">
                  Local Heuristic Mode
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(scheduleData.recommendedShifts || []).map((shift, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-slate-800/80 border border-indigo-800/80 hover:border-indigo-500/50 transition-all space-y-3 shadow-sm"
                >
                  <div className="flex items-start justify-between border-b border-indigo-900/80 pb-2.5">
                    <div>
                      <h4 className="font-bold text-sm text-white">{shift.shiftName}</h4>
                      <p className="text-xs font-mono text-indigo-300 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-indigo-400" /> {shift.timeRange}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight bg-indigo-950 text-indigo-300 border border-indigo-800">
                      {shift.predictedVolume}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="p-2 rounded-lg bg-indigo-950/80 border border-indigo-900">
                      <span className="text-[10px] text-indigo-400 block font-semibold">Waiters Needed</span>
                      <span className="text-lg font-black text-emerald-400 font-mono">
                        {shift.recommendedWaiters}
                      </span>
                    </div>

                    <div className="p-2 rounded-lg bg-indigo-950/80 border border-indigo-900">
                      <span className="text-[10px] text-indigo-400 block font-semibold">Chefs Needed</span>
                      <span className="text-lg font-black text-amber-400 font-mono">
                        {shift.recommendedChefs}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-indigo-200/90 leading-snug">
                    {shift.rationale}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Optimization Tips & Actions */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-3 border-t border-indigo-800/60">
            <div className="space-y-1 text-xs text-indigo-200">
              <span className="font-bold text-amber-400 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" /> Shift Optimization Directives:
              </span>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-indigo-300">
                {(scheduleData.optimizationTips || []).map((tip, i) => (
                  <li key={i}>{tip}</li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => setApplied(true)}
              disabled={applied}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-md transition-all shrink-0 ${
                applied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              {applied ? 'Shift Schedule Applied to Roster' : 'Apply AI Schedule to Shift Roster'}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};
