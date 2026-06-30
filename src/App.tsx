import React, { useState, useEffect } from 'react';
import { 
  Award, Bell, Check, CheckCircle2, ChevronRight, Clock, Eye, Filter, 
  HelpCircle, Loader2, LogIn, LogOut, Map, MapPin, MessageSquare, 
  Send, Shield, Sparkles, ThumbsDown, ThumbsUp, Trophy, User, Users, 
  ShieldAlert, Activity, AlertCircle, AlertTriangle, ArrowLeft, ArrowRight 
} from 'lucide-react';

import MapComponent from './components/MapComponent';
import AIChatBot from './components/AIChatBot';
import ImpactDashboard from './components/ImpactDashboard';
import ReportIssueWizard from './components/ReportIssueWizard';
import AdminPanel from './components/AdminPanel';

// Interfaces
interface ActivityLog {
  id: string;
  status: string;
  message: string;
  timestamp: string;
  updatedBy: string;
}

interface Comment {
  id: string;
  issueId: string;
  userId: string;
  userName: string;
  userAvatarColor: string;
  text: string;
  timestamp: string;
  statusUpdate?: 'Verify' | 'Reject' | 'General';
}

interface Issue {
  id: string;
  reporterId: string;
  reporterName: string;
  title: string;
  description: string;
  category: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  department: string;
  latitude: number;
  longitude: number;
  address: string;
  imageUrl?: string;
  status: 'Pending' | 'Assigned' | 'In Progress' | 'Resolved' | 'Closed';
  estimatedResolutionDays: number;
  confidenceScore: number;
  urgencyLevel: string;
  summary: string;
  createdAt: string;
  updatedAt: string;
  activityLog: ActivityLog[];
  upvotes: string[];
  downvotes: string[];
  comments: Comment[];
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarColor: string;
  citizenScore: number;
  badges: string[];
  role: 'Citizen' | 'Admin' | 'Staff';
  verifiedCount: number;
}

interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  timestamp: string;
  issueId?: string;
}

export default function App() {
  // Navigation & UI state
  const [view, setView] = useState<'landing' | 'dashboard' | 'report' | 'detail' | 'impact' | 'leaderboard' | 'admin'>('landing');
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);
  const [showChatDrawer, setShowChatDrawer] = useState(false);
  const [activeTab, setActiveTab] = useState<'All' | 'Pothole' | 'Water Leakage' | 'Garbage Heap' | 'Illegal Dumping' | 'Damaged Streetlight'>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'In Progress' | 'Resolved'>('All');

  // Authenticated Profile State (Auto populated from Elena Rostova)
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [emailInput, setEmailInput] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Issues & Notification lists from Backend
  const [issues, setIssues] = useState<Issue[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [leaderboard, setLeaderboard] = useState<UserProfile[]>([]);
  const [loadingIssues, setLoadingIssues] = useState(true);

  // Toast / Status Notification banner
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Detail view comment state
  const [commentInput, setCommentInput] = useState('');
  const [commentVerifyStatus, setCommentVerifyStatus] = useState<'Verify' | 'Reject' | 'General'>('General');

  // Helper for displaying Toast
  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch all issues from core fullstack backend
  async function fetchIssues() {
    setLoadingIssues(true);
    try {
      const response = await fetch('/api/issues');
      const data = await response.json();
      setIssues(data);
    } catch (err) {
      console.error('Error fetching issues:', err);
    } finally {
      setLoadingIssues(false);
    }
  }

  // Fetch notifications for logged in user
  async function fetchNotifications(userId: string) {
    try {
      const response = await fetch(`/api/notifications?userId=${userId}`);
      const data = await response.json();
      setNotifications(data);
    } catch (err) {
      console.error(err);
    }
  }

  // Fetch leaderboard
  async function fetchLeaderboard() {
    try {
      const response = await fetch('/api/leaderboard');
      const data = await response.json();
      setLeaderboard(data);
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    fetchIssues();
    fetchLeaderboard();
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchNotifications(currentUser.id);
      // Auto fetch periodically
      const interval = setInterval(() => {
        fetchNotifications(currentUser.id);
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [currentUser]);

  // Handle Authentication flow
  const handleAuth = async (email: string, isGoogleSim = false) => {
    const payload = isGoogleSim 
      ? { googleUser: { name: 'Google Explorer', email: 'explorer@gmail.com' } }
      : { email };

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (data.success) {
        setCurrentUser(data.user);
        showToast(`Authenticated successfully as ${data.user.name} (${data.user.role})!`);
        setShowAuthModal(false);
        setView('dashboard');
      }
    } catch (err) {
      console.error(err);
      showToast('Authentication connection failure.', 'error');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setView('landing');
    showToast('Session ended. Securely logged out.');
  };

  // Notification action clicks
  const handleNotificationRead = async (notifId: string, issueId?: string) => {
    try {
      await fetch(`/api/notifications/${notifId}/read`, { method: 'POST' });
      if (currentUser) fetchNotifications(currentUser.id);
      
      if (issueId) {
        setSelectedIssueId(issueId);
        setView('detail');
      }
      setShowNotificationMenu(false);
    } catch (err) {
      console.error(err);
    }
  };

  // Voting / Community verification action
  const handleVote = async (issueId: string, isVerify: boolean) => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }

    try {
      const response = await fetch(`/api/issues/${issueId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          isVerify
        })
      });
      const data = await response.json();
      if (data.success) {
        fetchIssues();
        // Reload current user to reflect updated citizenScore points
        const userRes = await fetch('/api/leaderboard');
        const users = await userRes.json();
        const updatedMe = users.find((u: any) => u.id === currentUser.id);
        if (updatedMe) setCurrentUser(updatedMe);

        showToast(isVerify 
          ? 'Incident verified! +5 Citizen Score points awarded.' 
          : 'Rejection logged. Civic audit points allocated.'
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Add Comment on issue detail
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !selectedIssueId || !commentInput.trim()) return;

    try {
      const response = await fetch(`/api/issues/${selectedIssueId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          userName: currentUser.name,
          text: commentInput,
          statusUpdate: commentVerifyStatus
        })
      });
      const data = await response.json();
      if (data.success) {
        setCommentInput('');
        setCommentVerifyStatus('General');
        fetchIssues();
        // Update local score
        const userRes = await fetch('/api/leaderboard');
        const users = await userRes.json();
        const updatedMe = users.find((u: any) => u.id === currentUser.id);
        if (updatedMe) setCurrentUser(updatedMe);

        showToast('Comment submitted. +5 Citizen Score points allocated!');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Selected Issue detail Object
  const currentSelectedIssue = issues.find(i => i.id === selectedIssueId);

  // Filtered issues list for feed
  const filteredIssues = issues.filter(issue => {
    const categoryMatch = activeTab === 'All' || issue.category === activeTab;
    const statusMatch = statusFilter === 'All' || 
                        (statusFilter === 'Pending' && issue.status === 'Pending') ||
                        (statusFilter === 'In Progress' && issue.status === 'In Progress') ||
                        (statusFilter === 'Resolved' && (issue.status === 'Resolved' || issue.status === 'Closed'));
    return categoryMatch && statusMatch;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Toast Notification Banner */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl border shadow-2xl flex items-center gap-2.5 animate-bounce ${
          toast.type === 'error' ? 'bg-rose-950 border-rose-800 text-rose-200' :
          toast.type === 'info' ? 'bg-slate-900 border-slate-700 text-slate-200' :
          'bg-emerald-950 border-emerald-800 text-emerald-200'
        }`}>
          {toast.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
          <span className="text-xs font-semibold">{toast.message}</span>
        </div>
      )}

      {/* Global Header */}
      <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          
          {/* Logo */}
          <div 
            onClick={() => setView('landing')} 
            className="flex items-center gap-2.5 cursor-pointer hover:opacity-90 select-none"
          >
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg border border-indigo-400">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-sm font-black tracking-wider text-slate-100 uppercase font-mono">Community Hero</span>
              <span className="text-xs font-bold text-indigo-400 block -mt-1 font-mono">INTELLIGENT CIVIC</span>
            </div>
          </div>

          {/* Navigation links */}
          {currentUser && (
            <nav className="hidden md:flex items-center gap-1 text-xs font-semibold">
              <button 
                onClick={() => setView('dashboard')}
                className={`px-3 py-2 rounded-lg transition-colors cursor-pointer ${view === 'dashboard' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Citizen Hub
              </button>
              <button 
                onClick={() => setView('report')}
                className={`px-3 py-2 rounded-lg transition-colors cursor-pointer ${view === 'report' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Report Issue
              </button>
              <button 
                onClick={() => setView('impact')}
                className={`px-3 py-2 rounded-lg transition-colors cursor-pointer ${view === 'impact' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Impact Analytics
              </button>
              <button 
                onClick={() => setView('leaderboard')}
                className={`px-3 py-2 rounded-lg transition-colors cursor-pointer ${view === 'leaderboard' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Leaderboard
              </button>
              {currentUser.role === 'Admin' && (
                <button 
                  onClick={() => setView('admin')}
                  className={`px-3 py-2 rounded-lg transition-colors cursor-pointer text-indigo-400 hover:text-indigo-300 font-bold border border-indigo-500/10 flex items-center gap-1 ${view === 'admin' ? 'bg-indigo-950/20' : ''}`}
                >
                  <Shield className="w-3.5 h-3.5" /> Staff Console
                </button>
              )}
            </nav>
          )}

          {/* Right Header Controls */}
          <div className="flex items-center gap-3">
            
            {/* Quick role toggler for easy review testing */}
            <div className="hidden lg:flex items-center gap-1.5 bg-slate-950/80 px-2.5 py-1.5 rounded-xl border border-slate-850">
              <span className="text-[9px] font-bold text-slate-500 font-mono uppercase">Role Fast Switch:</span>
              <button 
                onClick={() => handleAuth('elena@civichero.org')}
                className="text-[9px] bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/25 px-2 py-0.5 rounded-md font-mono font-bold cursor-pointer transition-colors"
              >
                Citizen Elena
              </button>
              <button 
                onClick={() => handleAuth('sarah.vance@city.gov')}
                className="text-[9px] bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/25 px-2 py-0.5 rounded-md font-mono font-bold cursor-pointer transition-colors"
              >
                Admin Vance
              </button>
            </div>

            {currentUser ? (
              <div className="flex items-center gap-3">
                
                {/* Score badge */}
                <div className="bg-gradient-to-r from-emerald-500/15 to-indigo-500/15 border border-slate-800/80 px-3 py-1.5 rounded-xl flex items-center gap-1.5 select-none">
                  <Award className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  <span className="text-[10px] font-mono font-extrabold text-slate-200">
                    {currentUser.citizenScore} XP
                  </span>
                </div>

                {/* Notification bell */}
                <div className="relative">
                  <button 
                    onClick={() => setShowNotificationMenu(!showNotificationMenu)}
                    className="w-9 h-9 rounded-xl hover:bg-slate-800/80 text-slate-400 hover:text-white flex items-center justify-center border border-slate-800/60 transition-colors relative cursor-pointer"
                  >
                    <Bell className="w-4.5 h-4.5" />
                    {notifications.filter(n => !n.read).length > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full animate-ping"></span>
                    )}
                  </button>

                  {/* Dropdown notification list */}
                  {showNotificationMenu && (
                    <div className="absolute right-0 mt-2.5 w-76 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50">
                      <div className="bg-slate-950 p-3 border-b border-slate-800 flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Notifications</span>
                        <span className="text-[9px] bg-slate-850 text-slate-400 px-2 py-0.5 rounded font-mono font-bold">
                          {notifications.filter(n => !n.read).length} Unread
                        </span>
                      </div>
                      <div className="max-h-64 overflow-y-auto divide-y divide-slate-850">
                        {notifications.length === 0 ? (
                          <p className="text-xs text-slate-500 p-4 text-center font-mono">No notifications logged.</p>
                        ) : (
                          notifications.map(notif => (
                            <div 
                              key={notif.id}
                              onClick={() => handleNotificationRead(notif.id, notif.issueId)}
                              className={`p-3 text-xs leading-normal cursor-pointer hover:bg-slate-950/40 transition-colors ${!notif.read ? 'bg-indigo-950/10 border-l-2 border-l-indigo-500' : ''}`}
                            >
                              <p className="font-bold text-slate-200 flex items-center gap-1">
                                {!notif.read && <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></span>}
                                {notif.title}
                              </p>
                              <p className="text-[10px] text-slate-400 mt-1">{notif.message}</p>
                              <span className="text-[9px] text-slate-500 font-mono block mt-1">
                                {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile menu */}
                <button 
                  onClick={handleLogout}
                  className="w-9 h-9 rounded-xl hover:bg-slate-800/80 text-rose-400 hover:text-rose-300 flex items-center justify-center border border-slate-800/60 transition-colors cursor-pointer"
                  title="Logout Session"
                >
                  <LogOut className="w-4.5 h-4.5" />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setShowAuthModal(true)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <LogIn className="w-4 h-4" /> Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:py-8 space-y-6">
        
        {/* VIEW 1: LANDING PAGE */}
        {view === 'landing' && (
          <div className="space-y-12 py-6">
            {/* Hero Section */}
            <div className="text-center space-y-4 max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-1.5 bg-indigo-500/10 border border-indigo-500/25 px-3 py-1.5 rounded-full text-indigo-400 text-xs font-mono font-bold uppercase tracking-wider">
                <Sparkles className="w-4 h-4 animate-pulse" />
                Hyperlocal Civic Intelligence Engine
              </div>
              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white leading-tight font-sans">
                Triage Civic Hazards in <br className="hidden md:inline" />
                <span className="bg-gradient-to-r from-indigo-400 via-emerald-400 to-indigo-500 bg-clip-text text-transparent">Real-Time with Gemini AI</span>
              </h1>
              <p className="text-sm md:text-base text-slate-400 leading-relaxed max-w-2xl mx-auto font-medium">
                Community Hero AI is a modern SaaS platform connecting citizens and municipal dispatchers. Capture local potholes, leaking pipes, or damaged streetlights. Let Gemini automatically analyze, category-triage, estimate days, and safety-verify.
              </p>
              
              <div className="pt-4 flex items-center justify-center gap-3">
                <button 
                  onClick={() => handleAuth('elena@civichero.org')}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-6 py-3 rounded-xl transition-all shadow-lg hover:shadow-indigo-500/20 flex items-center gap-1.5 cursor-pointer scale-105"
                >
                  Explore Citizen Demo Dashboard
                  <ChevronRight className="w-4.5 h-4.5" />
                </button>
              </div>
            </div>

            {/* Simulated Interactive Vision AI Teaser */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl max-w-4xl mx-auto space-y-4">
              <div className="text-center space-y-1">
                <span className="text-[10px] font-bold text-indigo-400 font-mono uppercase tracking-widest">Active Civic AI Demonstration</span>
                <h3 className="text-sm font-extrabold text-slate-100">Click a preset civic issue photo below to see how Gemini Vision AI diagnoses it</h3>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <button 
                  onClick={() => handleAuth('elena@civichero.org')}
                  className="group rounded-xl overflow-hidden h-20 relative border border-slate-800 hover:border-slate-700 transition-all cursor-pointer"
                >
                  <img src="https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=400&q=80" className="w-full h-full object-cover brightness-[0.4] group-hover:brightness-[0.5]" alt="Pothole" />
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white uppercase tracking-wider">Pothole</span>
                </button>
                <button 
                  onClick={() => handleAuth('elena@civichero.org')}
                  className="group rounded-xl overflow-hidden h-20 relative border border-slate-800 hover:border-slate-700 transition-all cursor-pointer"
                >
                  <img src="https://images.unsplash.com/photo-1509099836639-18ba1795216d?auto=format&fit=crop&w=400&q=80" className="w-full h-full object-cover brightness-[0.4] group-hover:brightness-[0.5]" alt="Streetlight" />
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white uppercase tracking-wider"> streetlight</span>
                </button>
                <button 
                  onClick={() => handleAuth('elena@civichero.org')}
                  className="group rounded-xl overflow-hidden h-20 relative border border-slate-800 hover:border-slate-700 transition-all cursor-pointer"
                >
                  <img src="https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=400&q=80" className="w-full h-full object-cover brightness-[0.4] group-hover:brightness-[0.5]" alt="Garbage" />
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white uppercase tracking-wider">Garbage heap</span>
                </button>
                <button 
                  onClick={() => handleAuth('elena@civichero.org')}
                  className="group rounded-xl overflow-hidden h-20 relative border border-slate-800 hover:border-slate-700 transition-all cursor-pointer"
                >
                  <img src="https://images.unsplash.com/photo-1542060748-10c28b629f6f?auto=format&fit=crop&w=400&q=80" className="w-full h-full object-cover brightness-[0.4] group-hover:brightness-[0.5]" alt="Water" />
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white uppercase tracking-wider">Water Pipe</span>
                </button>
                <button 
                  onClick={() => handleAuth('elena@civichero.org')}
                  className="group rounded-xl overflow-hidden h-20 relative border border-slate-800 hover:border-slate-700 transition-all cursor-pointer"
                >
                  <img src="https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=400&q=80" className="w-full h-full object-cover brightness-[0.4] group-hover:brightness-[0.5]" alt="Dumping" />
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white uppercase tracking-wider">Illegal Dumping</span>
                </button>
              </div>
            </div>

            {/* Feature Value Props Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl hover:border-slate-700/80 transition-all space-y-2">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 text-indigo-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-bold text-slate-100 uppercase tracking-widest font-mono">Gemini Vision AI</h4>
                <p className="text-xs text-slate-400 leading-relaxed font-medium">
                  Upload photos directly. Gemini Vision automatically detects category, assigns severe ranking, identifies city department, and drafts quick summaries.
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl hover:border-slate-700/80 transition-all space-y-2">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center border border-amber-500/20 text-amber-400">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-bold text-slate-100 uppercase tracking-widest font-mono">Duplicate Detection</h4>
                <p className="text-xs text-slate-400 leading-relaxed font-medium">
                  Prevents municipal database clogging. If someone reported a pothole in the same intersection, our engine prompts citizens to join forces instead.
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl hover:border-slate-700/80 transition-all space-y-2">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-400">
                  <Trophy className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-bold text-slate-100 uppercase tracking-widest font-mono">Gamified Badges</h4>
                <p className="text-xs text-slate-400 leading-relaxed font-medium">
                  Earn points for reporting, voting, and auditing civic alerts. Complete challenges to earn badges like "Road Warrior" and "Green Guardian".
                </p>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: CITIZEN DASHBOARD */}
        {view === 'dashboard' && currentUser && (
          <div className="space-y-6">
            
            {/* Stats Summary Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-sm">
              <div className="text-center md:border-r md:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-wider block">Logged Problems</span>
                <span className="text-xl font-mono font-extrabold text-slate-200 block mt-1">{issues.length}</span>
              </div>
              <div className="text-center md:border-r md:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-wider block">Resolved Cases</span>
                <span className="text-xl font-mono font-extrabold text-emerald-400 block mt-1">
                  {issues.filter(i => i.status === 'Resolved' || i.status === 'Closed').length}
                </span>
              </div>
              <div className="text-center md:border-r md:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-wider block">Verification Rate</span>
                <span className="text-xl font-mono font-extrabold text-indigo-400 block mt-1">88%</span>
              </div>
              <div className="text-center">
                <span className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-wider block">My Points Level</span>
                <span className="text-xl font-mono font-extrabold text-amber-400 block mt-1">{currentUser.citizenScore} XP</span>
              </div>
            </div>

            {/* Map & List Split */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Interactive map (Left side spanning 2 cols) */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-100 font-mono">Neighborhood Incident Map</h3>
                    <p className="text-[10px] text-slate-400">Live active warnings. Hover pins to explore.</p>
                  </div>
                  <button 
                    onClick={() => setView('report')}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <MapPin className="w-4 h-4" /> Log New Hazard
                  </button>
                </div>

                <MapComponent
                  issues={issues}
                  selectedIssueId={selectedIssueId || undefined}
                  onSelectIssue={(issueId) => {
                    setSelectedIssueId(issueId);
                    setView('detail');
                  }}
                  initialLat={37.7749}
                  initialLng={-122.4194}
                />
              </div>

              {/* Chat Assistant Widget (Right side spanning 1 col) */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-100 font-mono">Instant Support</h3>
                  <p className="text-[10px] text-slate-400">Ask Gemini about current cases or report rules.</p>
                </div>
                <AIChatBot currentUserId={currentUser.id} userName={currentUser.name} />
              </div>
            </div>

            {/* Active Feed with Categories */}
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex flex-wrap gap-1">
                  {(['All', 'Pothole', 'Water Leakage', 'Garbage Heap', 'Illegal Dumping', 'Damaged Streetlight'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono cursor-pointer transition-colors ${
                        activeTab === tab ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase font-mono">Status Filter:</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 font-semibold focus:outline-none focus:border-indigo-500"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                </div>
              </div>

              {/* Feed Card Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {loadingIssues ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="bg-slate-900 border border-slate-800/80 rounded-2xl h-56 p-4 animate-pulse flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="h-4 bg-slate-800 w-2/3 rounded"></div>
                        <div className="h-3 bg-slate-800 w-1/2 rounded"></div>
                      </div>
                      <div className="h-10 bg-slate-800 w-full rounded-xl"></div>
                    </div>
                  ))
                ) : filteredIssues.length === 0 ? (
                  <p className="text-xs text-slate-500 font-mono py-10 col-span-3 text-center">No reports match current categorical criteria.</p>
                ) : (
                  filteredIssues.map(issue => (
                    <div 
                      key={issue.id} 
                      className="bg-slate-900 border border-slate-800/80 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between group hover:border-slate-700 transition-all hover:shadow-lg"
                    >
                      {/* Card Image banner */}
                      {issue.imageUrl && (
                        <div className="h-32 w-full relative overflow-hidden shrink-0">
                          <img src={issue.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" alt={issue.title} />
                          <div className="absolute top-2.5 left-2.5 flex gap-1.5">
                            <span className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded-full border ${
                              issue.severity === 'Critical' ? 'bg-rose-500 text-white border-rose-400' :
                              issue.severity === 'High' ? 'bg-orange-500 text-white border-orange-400' : 'bg-amber-400 text-slate-950 border-amber-300'
                            }`}>
                              {issue.severity}
                            </span>
                            <span className="text-[9px] bg-slate-900/90 text-slate-200 font-mono px-2 py-0.5 rounded-full font-bold">
                              {issue.status}
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                        <div className="space-y-1.5">
                          <span className="text-[9px] font-bold font-mono tracking-widest text-indigo-400 uppercase">
                            {issue.category} • {issue.department}
                          </span>
                          <h4 className="text-sm font-extrabold text-slate-100 group-hover:text-indigo-400 transition-colors line-clamp-1">{issue.title}</h4>
                          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{issue.description}</p>
                        </div>

                        {/* Card bottom actions */}
                        <div className="pt-3 border-t border-slate-850 flex items-center justify-between">
                          <div className="flex gap-2.5">
                            <button
                              onClick={() => handleVote(issue.id, true)}
                              className={`flex items-center gap-1.5 text-xs font-mono font-bold cursor-pointer hover:opacity-85 ${
                                issue.upvotes.includes(currentUser.id) ? 'text-emerald-400' : 'text-slate-400'
                              }`}
                              title="Verify this Incident"
                            >
                              <ThumbsUp className="w-3.5 h-3.5" />
                              <span>{issue.upvotes.length}</span>
                            </button>
                            <button
                              onClick={() => handleVote(issue.id, false)}
                              className={`flex items-center gap-1.5 text-xs font-mono font-bold cursor-pointer hover:opacity-85 ${
                                issue.downvotes.includes(currentUser.id) ? 'text-rose-400' : 'text-slate-400'
                              }`}
                              title="Report as incorrect/fake"
                            >
                              <ThumbsDown className="w-3.5 h-3.5" />
                              <span>{issue.downvotes.length}</span>
                            </button>
                          </div>

                          <button
                            onClick={() => {
                              setSelectedIssueId(issue.id);
                              setView('detail');
                            }}
                            className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                          >
                            Triage Details
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: REPORT AN ISSUE */}
        {view === 'report' && currentUser && (
          <ReportIssueWizard
            currentUserId={currentUser.id}
            onSuccess={() => {
              fetchIssues();
              setView('dashboard');
            }}
            onCancel={() => setView('dashboard')}
          />
        )}

        {/* VIEW 4: DETAIL EXPLORER */}
        {view === 'detail' && currentUser && currentSelectedIssue && (
          <div className="space-y-6 max-w-4xl mx-auto">
            {/* Header back */}
            <button 
              onClick={() => setView('dashboard')}
              className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Return to Dashboard Feed
            </button>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Left Column (Details and Comments) spanning 2 cols */}
              <div className="md:col-span-2 space-y-6">
                
                {/* Visual Details Card */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-md">
                  {currentSelectedIssue.imageUrl && (
                    <div className="h-64 w-full relative">
                      <img src={currentSelectedIssue.imageUrl} className="w-full h-full object-cover" alt={currentSelectedIssue.title} />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>
                    </div>
                  )}

                  <div className="p-5 space-y-4 relative -mt-6">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] bg-indigo-500/15 text-indigo-300 px-3 py-1 rounded-full font-mono font-bold uppercase">
                        {currentSelectedIssue.category}
                      </span>
                      <span className="text-[10px] bg-rose-500/15 text-rose-400 px-3 py-1 rounded-full font-mono font-bold uppercase">
                        {currentSelectedIssue.severity} Severity
                      </span>
                      <span className="text-[10px] bg-slate-800 text-slate-300 px-3 py-1 rounded-full font-mono font-bold">
                        {currentSelectedIssue.status}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <h2 className="text-xl font-extrabold text-slate-100">{currentSelectedIssue.title}</h2>
                      <p className="text-xs text-slate-400 font-mono flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-rose-500" />
                        {currentSelectedIssue.address}
                      </p>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed font-medium">{currentSelectedIssue.description}</p>

                    {/* AI diagnosis block */}
                    {currentSelectedIssue.summary && (
                      <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-2">
                        <div className="flex items-center gap-1.5 text-indigo-400 font-mono text-[10px] font-bold uppercase">
                          <Sparkles className="w-4 h-4 animate-pulse" />
                          Intelligent AI Vision Diagnostics
                        </div>
                        <p className="text-xs text-slate-300 leading-normal">{currentSelectedIssue.summary}</p>
                        <div className="grid grid-cols-2 gap-3 pt-2 text-[11px] border-t border-slate-900 text-slate-400">
                          <p><strong>Department Assignee:</strong> {currentSelectedIssue.department}</p>
                          <p><strong>Urgency Threshold:</strong> {currentSelectedIssue.urgencyLevel}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Verification comments feed */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-100 font-mono">Community Audit Feed</h3>

                  {/* Comment input form */}
                  <form onSubmit={handleAddComment} className="space-y-3.5">
                    <textarea
                      placeholder="Comment on repair progress, add your verification note, or submit safety reports..."
                      value={commentInput}
                      onChange={(e) => setCommentInput(e.target.value)}
                      rows={3}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />

                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase font-mono">Audit Status:</span>
                        <select
                          value={commentVerifyStatus}
                          onChange={(e: any) => setCommentVerifyStatus(e.target.value)}
                          className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none"
                        >
                          <option value="General">General Comment</option>
                          <option value="Verify">Upvote & Verify Incident</option>
                          <option value="Reject">Downvote / Audit Failure</option>
                        </select>
                      </div>

                      <button
                        type="submit"
                        disabled={!commentInput.trim()}
                        className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold text-xs px-4.5 py-2.5 rounded-xl transition-all cursor-pointer shadow-md flex items-center gap-1.5 self-end sm:self-auto"
                      >
                        Submit Audit Comment
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </form>

                  {/* Comments list */}
                  <div className="space-y-3 divide-y divide-slate-850 pt-2">
                    {currentSelectedIssue.comments.length === 0 ? (
                      <p className="text-xs text-slate-500 font-mono py-4 text-center">No community verification remarks yet.</p>
                    ) : (
                      currentSelectedIssue.comments.map(comment => (
                        <div key={comment.id} className="pt-3 flex gap-3 text-xs">
                          <div className={`w-7 h-7 rounded-full bg-gradient-to-r ${comment.userAvatarColor} flex items-center justify-center font-bold text-white uppercase shrink-0`}>
                            {comment.userName.charAt(0)}
                          </div>
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center justify-between">
                              <p className="font-bold text-slate-200">{comment.userName}</p>
                              <span className="text-[9px] text-slate-500 font-mono">
                                {new Date(comment.timestamp).toLocaleDateString()}
                              </span>
                            </div>
                            
                            {comment.statusUpdate && comment.statusUpdate !== 'General' && (
                              <span className={`inline-flex items-center gap-1 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md ${
                                comment.statusUpdate === 'Verify' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                              }`}>
                                {comment.statusUpdate === 'Verify' ? '✓ VERIFIED INCIDENT' : '✗ REJECTED INCIDENT'}
                              </span>
                            )}

                            <p className="text-slate-300 leading-relaxed mt-1 font-medium">{comment.text}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column (Triage and Timeline) spanning 1 col */}
              <div className="space-y-6">
                
                {/* Triage Urgency Tracker */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-100 font-mono border-b border-slate-800 pb-2">Repair Timetable</h3>
                  
                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Current Status:</span>
                      <span className="font-bold text-indigo-400 font-mono">{currentSelectedIssue.status}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Triage Assignment:</span>
                      <span className="font-bold text-slate-200">{currentSelectedIssue.department}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Resolution Speed:</span>
                      <span className="font-bold text-slate-200 font-mono">~ {currentSelectedIssue.estimatedResolutionDays} Days</span>
                    </div>
                  </div>

                  {/* Horizontal progress indicators */}
                  <div className="space-y-1.5 pt-2">
                    <div className="flex justify-between text-[9px] font-mono font-bold text-slate-500">
                      <span>PENDING</span>
                      <span>IN PROGRESS</span>
                      <span>RESOLVED</span>
                    </div>
                    <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-850 relative">
                      <div className={`h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all ${
                        currentSelectedIssue.status === 'Pending' ? 'w-1/3' :
                        currentSelectedIssue.status === 'Assigned' ? 'w-1/2' :
                        currentSelectedIssue.status === 'In Progress' ? 'w-2/3' : 'w-full'
                      }`}></div>
                    </div>
                  </div>
                </div>

                {/* Audit timeline logs */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-100 font-mono">Civic Activity Ledger</h3>
                  <div className="relative border-l border-slate-800 pl-4.5 space-y-4 text-xs">
                    {currentSelectedIssue.activityLog.map((log, index) => (
                      <div key={log.id} className="relative">
                        {/* Bullet point indicator */}
                        <span className="absolute -left-[24px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-500 border-2 border-slate-900 shadow"></span>
                        
                        <p className="font-bold text-slate-200">{log.status}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5 leading-normal">{log.message}</p>
                        <div className="flex items-center gap-1.5 text-[9px] font-mono text-slate-500 mt-1">
                          <span>By {log.updatedBy}</span>
                          <span>•</span>
                          <span>{new Date(log.timestamp).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 5: IMPACT ANALYTICS */}
        {view === 'impact' && currentUser && (
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-100 font-mono">Neighborhood Impact Diagnostics</h3>
              <p className="text-[10px] text-slate-400">Core municipal performance and reporting statistics.</p>
            </div>
            <ImpactDashboard />
          </div>
        )}

        {/* VIEW 6: LEADERBOARD GAMIFICATION */}
        {view === 'leaderboard' && currentUser && (
          <div className="space-y-6 max-w-3xl mx-auto">
            <div className="text-center space-y-2">
              <Trophy className="w-10 h-10 text-amber-400 mx-auto animate-pulse" />
              <h3 className="text-base font-extrabold text-slate-100 uppercase tracking-wider font-mono">Neighborhood Civic Leaderboard</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">Citizen Hero ratings are based on active incident reports, community upvotes, and verification audits.</p>
            </div>

            {/* Top 3 display */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {leaderboard.slice(0, 3).map((user, index) => (
                <div key={user.id} className="bg-slate-900 border border-slate-850 p-5 rounded-2xl text-center space-y-3 shadow relative overflow-hidden">
                  <div className="absolute top-2.5 right-2.5 bg-indigo-500/10 text-indigo-400 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full">
                    Rank #{index + 1}
                  </div>
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${user.avatarColor} flex items-center justify-center text-xl font-bold text-white uppercase mx-auto border-2 border-slate-800`}>
                    {user.name.charAt(0)}
                  </div>
                  <div className="space-y-0.5">
                    <p className="font-bold text-slate-100">{user.name}</p>
                    <p className="text-[10px] text-slate-400">{user.role}</p>
                  </div>
                  <p className="text-lg font-mono font-black text-amber-400">{user.citizenScore} XP</p>
                  
                  {/* Badges list */}
                  <div className="flex flex-wrap gap-1 justify-center">
                    {user.badges.map(b => (
                      <span key={b} className="text-[9px] bg-slate-950 text-slate-300 font-semibold px-2 py-0.5 rounded font-mono">
                        {b}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Complete Registry logs */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-md">
              <div className="bg-slate-950 p-3 border-b border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Citizen Registry Index</span>
              </div>
              <div className="divide-y divide-slate-850">
                {leaderboard.map((user, index) => (
                  <div key={user.id} className="p-3.5 flex items-center justify-between gap-4 text-xs">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-slate-500 font-bold w-4 text-right">#{index + 1}</span>
                      <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${user.avatarColor} flex items-center justify-center font-bold text-white uppercase shrink-0`}>
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-200">{user.name}</p>
                        <p className="text-[9px] text-slate-500 font-mono uppercase">{user.role} • {user.verifiedCount} audits</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="hidden sm:flex gap-1">
                        {user.badges.slice(0, 2).map(badge => (
                          <span key={badge} className="text-[8px] bg-slate-950 border border-slate-850 text-slate-300 font-semibold px-2 py-0.5 rounded font-mono">
                            {badge}
                          </span>
                        ))}
                      </div>
                      <span className="font-mono font-extrabold text-amber-400 w-14 text-right">{user.citizenScore} XP</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 7: ADMIN STAFF PORTAL */}
        {view === 'admin' && currentUser && currentUser.role === 'Admin' && (
          <AdminPanel
            adminUserId={currentUser.id}
            onIssueUpdated={() => {
              fetchIssues();
              showToast('Incident updated successfully. Dispatch updated.');
            }}
          />
        )}
      </main>

      {/* Global Footer */}
      <footer className="mt-auto bg-slate-950 border-t border-slate-900 py-6 text-center text-slate-500 text-xs font-mono select-none">
        <p>© 2026 Community Hero AI Inc. • Powered by Google Gemini AI & GCloud Run</p>
        <p className="text-[10px] text-slate-600 mt-1">Real-time civic synchronization system active.</p>
      </footer>

      {/* Simple Simulated Authentication Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 w-full max-w-md space-y-4.5 shadow-2xl animate-scaleIn">
            <div className="text-center space-y-1">
              <h3 className="text-sm font-extrabold text-slate-100 uppercase tracking-widest font-mono">CIVIC PLATFORM SIGN IN</h3>
              <p className="text-xs text-slate-400">Access citizen reports and verify neighborhood hazards</p>
            </div>

            {/* Quick selectors - highly functional for test review */}
            <div className="space-y-2">
              <span className="text-[9px] font-bold text-slate-500 uppercase font-mono block">Simulate Authentication profiles:</span>
              <button 
                onClick={() => handleAuth('elena@civichero.org')}
                className="w-full bg-slate-950 hover:bg-slate-850 text-emerald-400 border border-emerald-500/20 hover:border-emerald-500/40 p-3 rounded-xl text-xs font-bold font-mono text-left flex justify-between items-center cursor-pointer transition-all"
              >
                <span>Elena Rostova (Active Citizen)</span>
                <span className="bg-emerald-500/10 px-2 py-0.5 rounded text-[9px] uppercase">Select</span>
              </button>
              <button 
                onClick={() => handleAuth('sarah.vance@city.gov')}
                className="w-full bg-slate-950 hover:bg-slate-850 text-indigo-400 border border-indigo-500/20 hover:border-indigo-500/40 p-3 rounded-xl text-xs font-bold font-mono text-left flex justify-between items-center cursor-pointer transition-all"
              >
                <span>Sarah Vance (City Administrator)</span>
                <span className="bg-indigo-500/10 px-2 py-0.5 rounded text-[9px] uppercase">Select</span>
              </button>
            </div>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-800"></div>
              <span className="flex-shrink mx-3 text-[9px] text-slate-500 font-mono font-bold uppercase">OR USE EMAIL REGISTER</span>
              <div className="flex-grow border-t border-slate-800"></div>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 font-mono uppercase block">Email Address</label>
                <input
                  type="email"
                  placeholder="your.name@gmail.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                onClick={() => emailInput.trim() && handleAuth(emailInput)}
                disabled={!emailInput.trim()}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold text-xs py-2.5 rounded-xl transition-all cursor-pointer shadow-md"
              >
                Connect to Civic Database
              </button>
            </div>

            <div className="text-center">
              <button 
                onClick={() => setShowAuthModal(false)}
                className="text-xs text-slate-500 hover:text-slate-300 font-semibold cursor-pointer"
              >
                Close Portal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
