import React, { useState, useEffect } from 'react';
import { Gavel, Clock, CheckCircle2, Shield, AlertTriangle, Loader2, RefreshCw } from 'lucide-react';

interface ActivityLog {
  id: string;
  status: string;
  message: string;
  timestamp: string;
  updatedBy: string;
}

interface Issue {
  id: string;
  title: string;
  category: string;
  severity: string;
  status: string;
  department: string;
  address: string;
  reporterName: string;
  createdAt: string;
  estimatedResolutionDays: number;
}

interface AdminPanelProps {
  adminUserId: string;
  onIssueUpdated: () => void;
}

export default function AdminPanel({ adminUserId, onIssueUpdated }: AdminPanelProps) {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);

  // Form states for modification
  const [status, setStatus] = useState('');
  const [department, setDepartment] = useState('');
  const [severity, setSeverity] = useState('');
  const [estDays, setEstDays] = useState(3);
  const [adminComment, setAdminComment] = useState('');
  const [saving, setSaving] = useState(false);

  async function fetchAllIssues() {
    setLoading(true);
    try {
      const response = await fetch('/api/issues');
      const data = await response.json();
      setIssues(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAllIssues();
  }, []);

  const selectIssueForEdit = (issue: Issue) => {
    setSelectedIssue(issue);
    setStatus(issue.status);
    setDepartment(issue.department);
    setSeverity(issue.severity);
    setEstDays(issue.estimatedResolutionDays);
    setAdminComment('');
  };

  const handleUpdateIssue = async () => {
    if (!selectedIssue) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/issues/${selectedIssue.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          department,
          severity,
          estimatedResolutionDays: estDays,
          commentText: adminComment,
          adminUserId
        })
      });

      if (response.ok) {
        setSelectedIssue(null);
        onIssueUpdated();
        await fetchAllIssues();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Resolved': return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'In Progress': return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'Assigned': return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
      case 'Closed': return 'bg-slate-500/15 text-slate-400 border border-slate-600/20';
      default: return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* HUD Header */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-100 uppercase tracking-widest font-mono flex items-center gap-2">
            <Shield className="w-4.5 h-4.5 text-indigo-400" />
            ADMINISTRATIVE DISPATCH HUB
          </h3>
          <p className="text-[10px] text-slate-400 mt-0.5">Authorized staff portal for direct community incident control.</p>
        </div>
        <button
          onClick={fetchAllIssues}
          className="bg-slate-800 hover:bg-slate-700/80 text-slate-200 border border-slate-700 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Registry
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Incident Registry Table */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col h-[520px]">
          <div className="bg-slate-950 p-4 border-b border-slate-800 shrink-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Incident Registry Logs</span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-850">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
              </div>
            ) : issues.length === 0 ? (
              <p className="text-xs text-slate-500 font-mono text-center py-12">No registered incidents in current municipal map.</p>
            ) : (
              issues.map(issue => (
                <div
                  key={issue.id}
                  onClick={() => selectIssueForEdit(issue)}
                  className={`p-4 transition-colors hover:bg-slate-950/40 cursor-pointer ${
                    selectedIssue?.id === issue.id ? 'bg-indigo-950/10 border-l-4 border-l-indigo-500' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-100">{issue.title}</p>
                      <p className="text-[10px] text-slate-400 truncate max-w-[320px]">{issue.address}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full ${getStatusColor(issue.status)}`}>
                          {issue.status}
                        </span>
                        <span className="text-[9px] bg-slate-800 text-slate-300 font-mono px-2 py-0.5 rounded-full font-semibold">
                          {issue.category}
                        </span>
                        <span className="text-[9px] text-slate-500 font-mono">
                          {new Date(issue.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${
                      issue.severity === 'Critical' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                      issue.severity === 'High' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                      {issue.severity}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Action Panel for selected issue */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4.5 flex flex-col h-[520px]">
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center shrink-0 mb-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Dispatch Triage Console</span>
          </div>

          {selectedIssue ? (
            <div className="flex-1 flex flex-col justify-between overflow-y-auto space-y-4">
              <div className="space-y-3">
                <div className="text-xs">
                  <p className="text-[9px] font-mono text-slate-500 uppercase">Selected Incident</p>
                  <p className="font-bold text-slate-200 mt-0.5 truncate">{selectedIssue.title}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Reporter: {selectedIssue.reporterName}</p>
                </div>

                {/* Status Dropdown */}
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 font-mono uppercase">Status Dispatch</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Assigned">Assigned</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>

                {/* Department Dropdown */}
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 font-mono uppercase">Assigned Authority</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
                  >
                    <option value="Public Works">Public Works</option>
                    <option value="Water Department">Water Department</option>
                    <option value="Sanitation Dept">Sanitation Dept</option>
                    <option value="Electricity & Power">Electricity & Power</option>
                    <option value="Environmental Services / Parks">Environmental Services / Parks</option>
                    <option value="Environmental Protection">Environmental Protection</option>
                  </select>
                </div>

                {/* Severity Dropdown */}
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 font-mono uppercase">Threat / Severity Index</label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>

                {/* Est days */}
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 font-mono uppercase">Estimated Repair Days</label>
                  <input
                    type="number"
                    value={estDays}
                    onChange={(e) => setEstDays(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none font-mono"
                  />
                </div>

                {/* Official Resolution comments */}
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 font-mono uppercase">Dispatch log note</label>
                  <textarea
                    placeholder="Enter dispatch updates, asphalt crew status, or resolution steps..."
                    value={adminComment}
                    onChange={(e) => setAdminComment(e.target.value)}
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none resize-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-850">
                <button
                  onClick={handleUpdateIssue}
                  disabled={saving}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2.5 rounded-xl cursor-pointer shadow-md transition-colors flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Dispatch Core Updates
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
              <Shield className="w-10 h-10 text-slate-600 mb-2 animate-pulse" />
              <p className="text-xs text-slate-400 leading-normal font-medium">Select an incident log item from the registry registry to dispatch repair crews.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
