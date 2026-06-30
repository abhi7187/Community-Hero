import React, { useState, useEffect } from 'react';
import { Trophy, TrendingUp, Shield, BarChart3, HelpCircle, Loader2 } from 'lucide-react';

interface ImpactData {
  totalReports: number;
  resolvedReports: number;
  resolutionRate: number;
  categoryDistribution: { name: string; value: number }[];
  areaDistribution: { name: string; count: number }[];
  departmentPerformance: { department: string; reports: number; resolutionRate: number; avgDays: number }[];
  trends: { date: string; reports: number }[];
}

export default function ImpactDashboard() {
  const [data, setData] = useState<ImpactData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchImpact() {
      try {
        const response = await fetch('/api/impact');
        const resData = await response.json();
        setData(resData);
      } catch (err) {
        console.error('Error fetching analytics:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchImpact();
  }, []);

  if (loading || !data) {
    return (
      <div className="h-[400px] flex flex-col items-center justify-center bg-slate-900 rounded-2xl border border-slate-800">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mb-2" />
        <p className="text-xs text-slate-400 font-mono">Calculating civic indices...</p>
      </div>
    );
  }

  // Find max reports for bar scaling
  const maxReports = Math.max(...data.departmentPerformance.map(d => d.reports), 1);
  const maxTrends = Math.max(...data.trends.map(t => t.reports), 1);

  return (
    <div className="space-y-6">
      {/* High Level Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-sm hover:border-slate-700 transition-all">
          <p className="text-[10px] font-bold text-slate-400 font-mono tracking-widest uppercase">Total Reports</p>
          <p className="text-3xl font-extrabold text-slate-100 mt-1 font-mono">{data.totalReports}</p>
          <span className="text-[9px] text-emerald-400 font-semibold flex items-center gap-1 mt-1 font-mono">
            ● Neighborhood Logged
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-sm hover:border-slate-700 transition-all">
          <p className="text-[10px] font-bold text-slate-400 font-mono tracking-widest uppercase">Resolved Cases</p>
          <p className="text-3xl font-extrabold text-emerald-400 mt-1 font-mono">{data.resolvedReports}</p>
          <span className="text-[9px] text-slate-400 font-semibold flex items-center gap-1 mt-1 font-mono">
            ● Successfully Repaired
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-sm hover:border-slate-700 transition-all">
          <p className="text-[10px] font-bold text-slate-400 font-mono tracking-widest uppercase">Resolution Rate</p>
          <p className="text-3xl font-extrabold text-indigo-400 mt-1 font-mono">{data.resolutionRate}%</p>
          <div className="w-full bg-slate-800 h-1 rounded-full mt-2 overflow-hidden">
            <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${data.resolutionRate}%` }}></div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-sm hover:border-slate-700 transition-all">
          <p className="text-[10px] font-bold text-slate-400 font-mono tracking-widest uppercase">Civic Security</p>
          <p className="text-3xl font-extrabold text-amber-400 mt-1 font-mono">Grade A</p>
          <span className="text-[9px] text-amber-500/80 font-semibold flex items-center gap-1 mt-1 font-mono">
            ● AI Duplicate Safe
          </span>
        </div>
      </div>

      {/* Visual Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Bespoke SVG Department performance bar chart */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-xs font-bold text-slate-100 uppercase tracking-widest font-mono">Department Workload</h4>
              <p className="text-[10px] text-slate-400">Reports filed per department</p>
            </div>
            <BarChart3 className="w-4 h-4 text-emerald-400" />
          </div>

          <div className="space-y-4">
            {data.departmentPerformance.map((dept, idx) => {
              const pct = (dept.reports / maxReports) * 100;
              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-300">{dept.department}</span>
                    <span className="text-slate-400 font-mono font-bold">{dept.reports} cases ({dept.resolutionRate}% res)</span>
                  </div>
                  <div className="relative w-full bg-slate-950 h-3.5 rounded-md overflow-hidden border border-slate-800">
                    <div 
                      className="bg-gradient-to-r from-emerald-500 to-indigo-600 h-full rounded-r-md transition-all duration-500" 
                      style={{ width: `${pct}%` }}
                    />
                    <span className="absolute right-2 top-0.5 text-[8px] font-extrabold text-slate-300 font-mono">
                      Avg. {dept.avgDays}d resolution
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart 2: Trends Line chart SVG */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-xs font-bold text-slate-100 uppercase tracking-widest font-mono">Weekly Incident Trends</h4>
              <p className="text-[10px] text-slate-400">Newly reported issues by day</p>
            </div>
            <TrendingUp className="w-4 h-4 text-indigo-400 animate-pulse" />
          </div>

          {/* SVG Line Chart */}
          <div className="relative w-full h-44 bg-slate-950 rounded-xl border border-slate-800 p-3 flex flex-col justify-between">
            <svg className="absolute inset-0 w-full h-full p-4" viewBox="0 0 100 100" preserveAspectRatio="none">
              {/* Reference Grid lines */}
              <line x1="0" y1="25" x2="100" y2="25" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="3" />
              <line x1="0" y1="50" x2="100" y2="50" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="3" />
              <line x1="0" y1="75" x2="100" y2="75" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="3" />

              {/* Path line */}
              <path
                d={`M ${data.trends.map((t, idx) => {
                  const x = (idx / (data.trends.length - 1)) * 100;
                  const y = 90 - (t.reports / maxTrends) * 80;
                  return `${x} ${y}`;
                }).join(' L ')}`}
                fill="none"
                stroke="url(#trend-gradient)"
                strokeWidth="3"
                strokeLinecap="round"
              />

              {/* Area Under Path */}
              <path
                d={`M 0 100 L ${data.trends.map((t, idx) => {
                  const x = (idx / (data.trends.length - 1)) * 100;
                  const y = 90 - (t.reports / maxTrends) * 80;
                  return `${x} ${y}`;
                }).join(' L ')} L 100 100 Z`}
                fill="url(#area-gradient)"
                opacity="0.15"
              />

              {/* Points */}
              {data.trends.map((t, idx) => {
                const x = (idx / (data.trends.length - 1)) * 100;
                const y = 90 - (t.reports / maxTrends) * 80;
                return (
                  <circle
                    key={idx}
                    cx={x}
                    cy={y}
                    r="2.5"
                    fill="#3b82f6"
                    stroke="#ffffff"
                    strokeWidth="1"
                  />
                );
              })}

              <defs>
                <linearGradient id="trend-gradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
                <linearGradient id="area-gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="transparent" />
                </linearGradient>
              </defs>
            </svg>

            <div className="absolute inset-x-0 bottom-1 px-4 flex justify-between text-[9px] font-mono text-slate-400">
              {data.trends.map((t, idx) => (
                <span key={idx}>{t.date}</span>
              ))}
            </div>

            <div className="absolute inset-y-2 left-2 flex flex-col justify-between text-[8px] font-mono text-slate-500">
              <span>{maxTrends}</span>
              <span>{Math.round(maxTrends / 2)}</span>
              <span>0</span>
            </div>
          </div>
        </div>
      </div>

      {/* Area Affected Breakdown list */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-md">
        <h4 className="text-xs font-bold text-slate-100 uppercase tracking-widest font-mono mb-3">Hyperlocal Sector Hotspots</h4>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {data.areaDistribution.map((area, idx) => (
            <div key={idx} className="bg-slate-950/80 border border-slate-850 p-3 rounded-xl text-center">
              <span className="text-[10px] font-bold text-slate-400 block truncate font-mono uppercase">{area.name}</span>
              <span className="text-xl font-extrabold text-indigo-400 mt-1 block font-mono">{area.count}</span>
              <span className="text-[8px] text-slate-500 font-semibold">Active Alerts</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
