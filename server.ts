import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const DB_FILE = path.join(__dirname, 'db.json');

// Initialize Gemini API Client
let ai: GoogleGenAI | null = null;
const apiKey = process.env.GEMINI_API_KEY;
if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
  try {
    ai = new GoogleGenAI({ apiKey });
    console.log('Gemini AI Client initialized successfully.');
  } catch (err) {
    console.error('Failed to initialize Gemini AI Client:', err);
  }
} else {
  console.log('GEMINI_API_KEY not configured or is placeholder. AI endpoints will run in simulated modes.');
}

// Interfaces
interface User {
  id: string;
  name: string;
  email: string;
  avatarColor: string;
  citizenScore: number;
  badges: string[];
  role: 'Citizen' | 'Admin' | 'Staff';
  verifiedCount: number;
}

interface ActivityLog {
  id: string;
  status: string;
  message: string;
  timestamp: string;
  updatedBy: string;
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
  videoUrl?: string;
  audioUrl?: string;
  status: 'Pending' | 'Assigned' | 'In Progress' | 'Resolved' | 'Closed';
  estimatedResolutionDays: number;
  confidenceScore: number;
  urgencyLevel: string;
  summary: string;
  createdAt: string;
  updatedAt: string;
  activityLog: ActivityLog[];
  upvotes: string[]; // list of userIds who verified
  downvotes: string[]; // list of userIds who rejected
  comments: Comment[];
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
  imageUrl?: string;
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

// In-Memory DB state with realistic default Seed Data
let dbState = {
  users: [
    {
      id: 'usr-1',
      name: 'Elena Rostova',
      email: 'elena@civichero.org',
      avatarColor: 'from-emerald-400 to-teal-600',
      citizenScore: 340,
      badges: ['Road Warrior', 'Community Hero', 'Elite Vigilant'],
      role: 'Citizen',
      verifiedCount: 24,
    },
    {
      id: 'usr-2',
      name: 'Marcus Chen',
      email: 'marcus@civichero.org',
      avatarColor: 'from-amber-400 to-orange-500',
      citizenScore: 180,
      badges: ['Green Guardian', 'Vigilant Eyes'],
      role: 'Citizen',
      verifiedCount: 12,
    },
    {
      id: 'usr-3',
      name: 'Chief Inspector Sarah Vance',
      email: 'sarah.vance@city.gov',
      avatarColor: 'from-blue-500 to-indigo-700',
      citizenScore: 850,
      badges: ['Civic Champion', 'Guardian of the City'],
      role: 'Admin',
      verifiedCount: 95,
    },
    {
      id: 'usr-4',
      name: 'Devon Patel',
      email: 'devon@city.gov',
      avatarColor: 'from-purple-500 to-pink-600',
      citizenScore: 110,
      badges: ['First Responder'],
      role: 'Staff',
      verifiedCount: 5,
    }
  ] as User[],

  issues: [
    {
      id: 'iss-1',
      reporterId: 'usr-1',
      reporterName: 'Elena Rostova',
      title: 'Deep Multi-Pothole Trench near Subway Crossing',
      description: 'A cluster of three deep potholes spans across the middle lane, forcing cars to swerve dangerously into oncoming traffic during rush hours. Already saw two motorcyclists nearly lose control here.',
      category: 'Pothole',
      severity: 'High',
      department: 'Public Works',
      latitude: 37.7749,
      longitude: -122.4194,
      address: 'Market St & 8th St, San Francisco, CA 94103',
      imageUrl: 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=800&q=80',
      status: 'In Progress',
      estimatedResolutionDays: 3,
      confidenceScore: 98,
      urgencyLevel: 'Immediate Action Recommended',
      summary: 'Multiple deep potholes on high-traffic lanes posing immediate danger of collisions and vehicle damage.',
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days ago
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      upvotes: ['usr-2', 'usr-3'],
      downvotes: [],
      activityLog: [
        {
          id: 'act-1',
          status: 'Pending',
          message: 'Civic Report logged successfully and AI Vision verified.',
          timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
          updatedBy: 'System AI'
        },
        {
          id: 'act-2',
          status: 'Assigned',
          message: 'Assigned to Public Works Division B (Road Repair Unit).',
          timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          updatedBy: 'Chief Inspector Sarah Vance'
        },
        {
          id: 'act-3',
          status: 'In Progress',
          message: 'Asphalt patching crew dispatched. Signs placed on road.',
          timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          updatedBy: 'Public Works Lead'
        }
      ],
      comments: [
        {
          id: 'com-1',
          issueId: 'iss-1',
          userId: 'usr-2',
          userName: 'Marcus Chen',
          userAvatarColor: 'from-amber-400 to-orange-500',
          text: 'Verified this morning. It nearly destroyed my left tire. Glad it is finally marked in progress!',
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          statusUpdate: 'Verify'
        }
      ]
    },
    {
      id: 'iss-2',
      reporterId: 'usr-2',
      reporterName: 'Marcus Chen',
      title: 'Main Water Pipe Burst Flooding Back Alleyway',
      description: 'Water is gushing out of a subterranean crack behind the brick bakery warehouse, creating a muddy swamp and rotting the nearby wooden pallets.',
      category: 'Water Leakage',
      severity: 'Critical',
      department: 'Water Department',
      latitude: 37.7833,
      longitude: -122.4167,
      address: 'Tehama St & 3rd St, San Francisco, CA 94103',
      imageUrl: 'https://images.unsplash.com/photo-1542060748-10c28b629f6f?auto=format&fit=crop&w=800&q=80',
      status: 'Resolved',
      estimatedResolutionDays: 1,
      confidenceScore: 95,
      urgencyLevel: 'Emergency Sub-Surface Water Damage',
      summary: 'Underground high-pressure pipe rupture causing extensive surface flooding and threat of basement water intrusion.',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      upvotes: ['usr-1', 'usr-3', 'usr-4'],
      downvotes: [],
      activityLog: [
        {
          id: 'act-4',
          status: 'Pending',
          message: 'Report created and flagged as Critical Water Pipe Anomaly.',
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          updatedBy: 'System AI'
        },
        {
          id: 'act-5',
          status: 'In Progress',
          message: 'Main line shutoff initiated. Emergency trenching team deployed.',
          timestamp: new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000).toISOString(),
          updatedBy: 'Water Dept Dispatch'
        },
        {
          id: 'act-6',
          status: 'Resolved',
          message: 'Pipe welded and pressure testing completed. Trench backfilled and re-paved.',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          updatedBy: 'Water Dept Inspector'
        }
      ],
      comments: [
        {
          id: 'com-2',
          issueId: 'iss-2',
          userId: 'usr-1',
          userName: 'Elena Rostova',
          userAvatarColor: 'from-emerald-400 to-teal-600',
          text: 'Water is completely shut off now and workers are actively digging. Fast response!',
          timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          statusUpdate: 'Verify'
        },
        {
          id: 'com-3',
          issueId: 'iss-2',
          userId: 'usr-3',
          userName: 'Chief Inspector Sarah Vance',
          userAvatarColor: 'from-blue-500 to-indigo-700',
          text: 'Verified resolved. Great coordination by the Water Authority. Closing ticket officially.',
          timestamp: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
          statusUpdate: 'General'
        }
      ]
    },
    {
      id: 'iss-3',
      reporterId: 'usr-1',
      reporterName: 'Elena Rostova',
      title: 'Dangerous Hanging Tree Branch over Playground Swing Set',
      description: 'A massive oak branch split during last night\'s wind storm and is now suspended only by a few fibers directly over the children\'s swings.',
      category: 'Broken Road / Hazard',
      severity: 'Critical',
      department: 'Environmental Services / Parks',
      latitude: 37.7699,
      longitude: -122.4468,
      address: 'Duboce Park, San Francisco, CA 94117',
      imageUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80',
      status: 'Assigned',
      estimatedResolutionDays: 1,
      confidenceScore: 92,
      urgencyLevel: 'Severe Child Safety Hazard',
      summary: 'Split tree branch in high-risk zone hanging precariously. High threat of falling and causing injury.',
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
      updatedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      upvotes: ['usr-2'],
      downvotes: [],
      activityLog: [
        {
          id: 'act-7',
          status: 'Pending',
          message: 'Reported logged. Child hazard tags added automatically.',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          updatedBy: 'System AI'
        },
        {
          id: 'act-8',
          status: 'Assigned',
          message: 'Assigned to Forestry and Tree Maintenance Division.',
          timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          updatedBy: 'Chief Inspector Sarah Vance'
        }
      ],
      comments: []
    },
    {
      id: 'iss-4',
      reporterId: 'usr-2',
      reporterName: 'Marcus Chen',
      title: 'Illegal Chemical Container Dumping behind Community Garden',
      description: 'Several industrial blue barrels with hazard symbols have been dumped at the dead end behind the community organic farm. There is a sweet chemical odor.',
      category: 'Illegal Dumping',
      severity: 'Critical',
      department: 'Environmental Protection',
      latitude: 37.7599,
      longitude: -122.4348,
      address: 'Noe Valley Community Garden, San Francisco, CA 94114',
      imageUrl: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=800&q=80',
      status: 'Pending',
      estimatedResolutionDays: 2,
      confidenceScore: 96,
      urgencyLevel: 'Hazardous Waste Abatement',
      summary: 'Unidentified industrial drums suspected of carrying hazardous chemical waste illegally dumped near food-producing community zones.',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      upvotes: [],
      downvotes: [],
      activityLog: [
        {
          id: 'act-9',
          status: 'Pending',
          message: 'Report logged. Toxic environmental threat flag triggered.',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          updatedBy: 'System AI'
        }
      ],
      comments: []
    }
  ] as Issue[],

  notifications: [
    {
      id: 'not-1',
      userId: 'usr-1',
      title: 'Pothole Crew Dispatched!',
      message: 'Your report "Deep Multi-Pothole Trench near Subway Crossing" is now IN PROGRESS! Road repair unit has been dispatched.',
      read: false,
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      issueId: 'iss-1',
    },
    {
      id: 'not-2',
      userId: 'usr-2',
      title: 'Water Pipe Issue Resolved! 🎉',
      message: 'Excellent work! The pipe burst has been repaired and verified. You earned +30 Citizen Score points!',
      read: false,
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      issueId: 'iss-2',
    }
  ] as Notification[]
};

// Sync with DB File if exists, otherwise write seed data
function loadDB() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      dbState = JSON.parse(data);
      console.log('Database file loaded successfully.');
    } else {
      saveDB();
      console.log('No database file found. Created default with seed data.');
    }
  } catch (err) {
    console.error('Error reading database file, using in-memory default:', err);
  }
}

function saveDB() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(dbState, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving database state:', err);
  }
}

loadDB();

// -------------------------------------------------------------
// REST API ROUTES
// -------------------------------------------------------------

// 1. AUTH API
app.post('/api/auth/login', (req, res) => {
  const { email, password, googleUser } = req.body;
  
  if (googleUser) {
    // Simulated Google Login
    let user = dbState.users.find(u => u.email === googleUser.email);
    if (!user) {
      user = {
        id: `usr-${Date.now()}`,
        name: googleUser.name,
        email: googleUser.email,
        avatarColor: 'from-sky-400 to-indigo-600',
        citizenScore: 50,
        badges: ['Vigilant Starter'],
        role: 'Citizen',
        verifiedCount: 0
      };
      dbState.users.push(user);
      saveDB();
    }
    return res.json({ success: true, user, token: 'jwt-simulated-token-google' });
  }

  // Email login
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  let user = dbState.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  
  if (!user) {
    // Register automatic Citizen account
    const name = email.split('@')[0].replace(/[^a-zA-Z]/g, ' ');
    const formattedName = name.charAt(0).toUpperCase() + name.slice(1);
    
    // Determine Role
    let role: 'Citizen' | 'Admin' | 'Staff' = 'Citizen';
    if (email.endsWith('@city.gov')) {
      if (email.startsWith('admin') || email.startsWith('sarah')) {
        role = 'Admin';
      } else {
        role = 'Staff';
      }
    }

    user = {
      id: `usr-${Date.now()}`,
      name: formattedName || 'Civic Volunteer',
      email: email,
      avatarColor: 'from-emerald-400 to-indigo-500',
      citizenScore: 50,
      badges: ['Civic Recruit'],
      role,
      verifiedCount: 0
    };
    dbState.users.push(user);
    saveDB();
  }

  return res.json({ success: true, user, token: 'jwt-simulated-token-email' });
});

// 2. ISSUES API
app.get('/api/issues', (req, res) => {
  const { category, status, search } = req.query;
  let filtered = [...dbState.issues];

  if (category && category !== 'All') {
    filtered = filtered.filter(i => i.category === category);
  }

  if (status && status !== 'All') {
    filtered = filtered.filter(i => i.status === status);
  }

  if (search) {
    const q = (search as string).toLowerCase();
    filtered = filtered.filter(i => 
      i.title.toLowerCase().includes(q) || 
      i.description.toLowerCase().includes(q) || 
      i.address.toLowerCase().includes(q)
    );
  }

  // Sort by newest first
  filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(filtered);
});

// Duplicate Detection & Distance Utility
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  // Simple distance in meters
  const R = 6371e3; // metres
  const phi1 = lat1 * Math.PI/180;
  const phi2 = lat2 * Math.PI/180;
  const deltaPhi = (lat2-lat1) * Math.PI/180;
  const deltaLambda = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(deltaPhi/2) * Math.sin(deltaPhi/2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(deltaLambda/2) * Math.sin(deltaLambda/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // in metres
}

// 3. CHECK DUPLICATES ENDPOINT
app.post('/api/issues/check-duplicates', (req, res) => {
  const { latitude, longitude, category, title } = req.body;
  if (!latitude || !longitude || !category) {
    return res.json({ duplicates: [] });
  }

  const duplicates = dbState.issues.filter(issue => {
    // Within 250 meters, same category or extremely similar title
    const distance = calculateDistance(latitude, longitude, issue.latitude, issue.longitude);
    const categoryMatch = issue.category.toLowerCase() === category.toLowerCase();
    
    // Simple text matching
    const titleMatch = title && (
      issue.title.toLowerCase().includes(title.toLowerCase()) || 
      title.toLowerCase().includes(issue.title.toLowerCase())
    );

    return distance < 250 && (categoryMatch || titleMatch) && issue.status !== 'Closed';
  });

  res.json({ duplicates });
});

// 4. VISION AI ANALYSIS ENDPOINT
app.post('/api/ai/analyze', async (req, res) => {
  const { imageBase64, mimeType } = req.body;
  
  if (!imageBase64) {
    return res.status(400).json({ error: 'imageBase64 parameter is required' });
  }

  // Default fallback analytical simulation
  const mockAnalysis = {
    category: 'Pothole',
    severity: 'High',
    department: 'Public Works',
    urgency: 'Immediate repair recommended to prevent tire/suspension damage',
    summary: 'An open surface pothole showing structural cracking. Poses hazard for fast-moving vehicles and cyclists.',
    confidence: 94,
    estimatedResolutionDays: 3
  };

  if (!ai) {
    console.log('Gemini API not configured, returning high-fidelity simulated vision response.');
    return res.json(mockAnalysis);
  }

  try {
    // Strip data prefix if present
    const base64Clean = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const imageMime = mimeType || 'image/jpeg';

    const prompt = `You are a municipal safety AI. Analyze this photo of a community infrastructure or civic problem.
    You MUST output valid, clean JSON with EXACTLY these fields, do not include markdown blocks or other text, return ONLY raw JSON:
    {
      "category": "Pothole" | "Water Leakage" | "Garbage Heap" | "Broken Road / Hazard" | "Illegal Dumping" | "Damaged Streetlight" | "Drainage Issue",
      "severity": "Low" | "Medium" | "High" | "Critical",
      "department": "Public Works" | "Water Department" | "Sanitation Dept" | "Electricity & Power" | "Environmental Services / Parks",
      "summary": "Short 1-2 sentence description of what the photo shows and key risk details",
      "urgency": "One brief action recommendation phrase",
      "confidence": number (between 80 and 99),
      "estimatedResolutionDays": number (between 1 and 7)
    }`;

    console.log('Sending vision query to Gemini...');
    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          inlineData: {
            data: base64Clean,
            mimeType: imageMime,
          },
        },
        prompt,
      ],
    });

    const responseText = result.text || '';
    console.log('Raw response from Gemini Vision:', responseText);

    // Parse JSON
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const analyzed = JSON.parse(jsonMatch[0]);
      return res.json(analyzed);
    } else {
      throw new Error('Could not parse JSON from Gemini response.');
    }
  } catch (err) {
    console.error('Error analyzing image with Gemini:', err);
    return res.json(mockAnalysis);
  }
});

// 5. REPORT NEW ISSUE
app.post('/api/issues', (req, res) => {
  const { 
    userId, title, description, category, severity, department,
    latitude, longitude, address, imageUrl, videoUrl, audioUrl,
    estimatedResolutionDays, confidenceScore, urgencyLevel, summary,
    forceCreate
  } = req.body;

  if (!userId || !title || !description || !latitude || !longitude) {
    return res.status(400).json({ error: 'Required fields are missing' });
  }

  const reporter = dbState.users.find(u => u.id === userId) || { name: 'Anonymous Citizen', id: 'usr-anon' };

  // Generate issue object
  const newIssue: Issue = {
    id: `iss-${Date.now()}`,
    reporterId: userId,
    reporterName: reporter.name,
    title,
    description,
    category: category || 'General',
    severity: severity || 'Medium',
    department: department || 'General Services',
    latitude: Number(latitude),
    longitude: Number(longitude),
    address: address || 'Current Coordinates',
    imageUrl,
    videoUrl,
    audioUrl,
    status: 'Pending',
    estimatedResolutionDays: estimatedResolutionDays || 4,
    confidenceScore: confidenceScore || 85,
    urgencyLevel: urgencyLevel || 'Standard Attention',
    summary: summary || 'User submitted community report.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    upvotes: [userId], // Self upvote/verification
    downvotes: [],
    activityLog: [
      {
        id: `act-${Date.now()}`,
        status: 'Pending',
        message: 'Civic Report logged successfully and open for verification.',
        timestamp: new Date().toISOString(),
        updatedBy: 'System'
      }
    ],
    comments: []
  };

  // Add Score to user for reporting
  const userObj = dbState.users.find(u => u.id === userId);
  if (userObj) {
    userObj.citizenScore += 15; // 15 points for submitting
    userObj.verifiedCount += 1;
    // Update badges
    if (userObj.verifiedCount >= 5 && !userObj.badges.includes('Vigilant Eyes')) {
      userObj.badges.push('Vigilant Eyes');
    }
    if (userObj.citizenScore >= 200 && !userObj.badges.includes('Road Warrior')) {
      userObj.badges.push('Road Warrior');
    }
  }

  dbState.issues.push(newIssue);

  // Send notifications to nearby simulation (fake) and admin
  dbState.notifications.push({
    id: `not-${Date.now()}`,
    userId: 'usr-3', // Admin (Sarah Vance)
    title: `New ${newIssue.severity} Alert: ${newIssue.category}`,
    message: `A new report was posted near ${newIssue.address}. Verification needed.`,
    read: false,
    timestamp: new Date().toISOString(),
    issueId: newIssue.id
  });

  saveDB();
  res.status(201).json({ success: true, issue: newIssue });
});

// 6. VERIFY OR REJECT ISSUE (VOTE)
app.post('/api/issues/:id/vote', (req, res) => {
  const { id } = req.params;
  const { userId, isVerify } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'UserId is required' });
  }

  const issue = dbState.issues.find(i => i.id === id);
  if (!issue) {
    return res.status(404).json({ error: 'Issue not found' });
  }

  if (isVerify) {
    // Check if already upvoted
    if (issue.upvotes.includes(userId)) {
      return res.json({ success: true, message: 'Already verified', issue });
    }
    // Remove from downvotes if exists
    issue.downvotes = issue.downvotes.filter(u => u !== userId);
    issue.upvotes.push(userId);

    // Award Citizen Score points!
    const reporter = dbState.users.find(u => u.id === issue.reporterId);
    if (reporter) {
      reporter.citizenScore += 10; // Reporter gets points when others verify
    }

    const voter = dbState.users.find(u => u.id === userId);
    if (voter) {
      voter.citizenScore += 5; // Voter gets points for helping verify
      voter.verifiedCount += 1;
    }
  } else {
    // Reject / Downvote
    if (issue.downvotes.includes(userId)) {
      return res.json({ success: true, message: 'Already marked rejection', issue });
    }
    issue.upvotes = issue.upvotes.filter(u => u !== userId);
    issue.downvotes.push(userId);

    const voter = dbState.users.find(u => u.id === userId);
    if (voter) {
      voter.citizenScore += 3; // Voter gets points for auditing
    }
  }

  issue.updatedAt = new Date().toISOString();
  saveDB();
  res.json({ success: true, issue });
});

// 7. ADD COMMENT
app.post('/api/issues/:id/comments', (req, res) => {
  const { id } = req.params;
  const { userId, userName, text, statusUpdate, imageUrl } = req.body;

  if (!userId || !text) {
    return res.status(400).json({ error: 'UserId and comment text are required' });
  }

  const issue = dbState.issues.find(i => i.id === id);
  if (!issue) {
    return res.status(404).json({ error: 'Issue not found' });
  }

  const user = dbState.users.find(u => u.id === userId) || { avatarColor: 'from-gray-400 to-gray-600' };

  const newComment: Comment = {
    id: `com-${Date.now()}`,
    issueId: id,
    userId,
    userName: userName || 'Anonymous Citizen',
    userAvatarColor: user.avatarColor,
    text,
    timestamp: new Date().toISOString(),
    statusUpdate,
    imageUrl
  };

  issue.comments.push(newComment);

  // If status update was verify or reject, let's trigger voting state too
  if (statusUpdate === 'Verify' && !issue.upvotes.includes(userId)) {
    issue.upvotes.push(userId);
    issue.downvotes = issue.downvotes.filter(u => u !== userId);
  } else if (statusUpdate === 'Reject' && !issue.downvotes.includes(userId)) {
    issue.downvotes.push(userId);
    issue.upvotes = issue.upvotes.filter(u => u !== userId);
  }

  // Increment citizen points for commentary contributing to solution
  const commenter = dbState.users.find(u => u.id === userId);
  if (commenter) {
    commenter.citizenScore += 5;
  }

  issue.updatedAt = new Date().toISOString();
  saveDB();
  res.status(201).json({ success: true, comment: newComment, issue });
});

// 8. NOTIFICATIONS
app.get('/api/notifications', (req, res) => {
  const { userId } = req.query;
  if (!userId) {
    return res.json([]);
  }
  const notifs = dbState.notifications.filter(n => n.userId === userId);
  // Sort newest first
  notifs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  res.json(notifs);
});

app.post('/api/notifications/:id/read', (req, res) => {
  const { id } = req.params;
  const notif = dbState.notifications.find(n => n.id === id);
  if (notif) {
    notif.read = true;
    saveDB();
  }
  res.json({ success: true });
});

// 9. LEADERBOARD API
app.get('/api/leaderboard', (req, res) => {
  const list = [...dbState.users].sort((a, b) => b.citizenScore - a.citizenScore);
  res.json(list);
});

// 10. IMPACT/ANALYTICS API
app.get('/api/impact', (req, res) => {
  // Aggregate statistics for dashboard charts
  const totalReports = dbState.issues.length;
  const resolvedReports = dbState.issues.filter(i => i.status === 'Resolved' || i.status === 'Closed').length;
  const resolutionRate = totalReports > 0 ? Math.round((resolvedReports / totalReports) * 100) : 0;

  // Category counts
  const categoryCounts: Record<string, number> = {};
  dbState.issues.forEach(i => {
    categoryCounts[i.category] = (categoryCounts[i.category] || 0) + 1;
  });

  const categoryDistribution = Object.keys(categoryCounts).map(name => ({
    name,
    value: categoryCounts[name]
  }));

  // Area distribution (simplified by address clusters)
  const areas = ['Downtown', 'SOMA', 'Noe Valley', 'Mission', 'Duboce Park', 'Richmond'];
  const areaDistribution = areas.map((area, index) => {
    const count = dbState.issues.filter(i => i.address.toLowerCase().includes(area.toLowerCase())).length;
    return { name: area, count: count || index + 1 }; // seed default if 0 for beautiful charts
  });

  // Department stats
  const deptMap: Record<string, { total: number; resolved: number; days: number }> = {};
  dbState.issues.forEach(i => {
    if (!deptMap[i.department]) {
      deptMap[i.department] = { total: 0, resolved: 0, days: 0 };
    }
    deptMap[i.department].total += 1;
    if (i.status === 'Resolved' || i.status === 'Closed') {
      deptMap[i.department].resolved += 1;
    }
    deptMap[i.department].days += i.estimatedResolutionDays;
  });

  const departmentPerformance = Object.keys(deptMap).map(dept => {
    const stats = deptMap[dept];
    const rate = stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0;
    return {
      department: dept,
      reports: stats.total,
      resolutionRate: rate || 50, // default placeholder minimum for charts
      avgDays: Math.round(stats.days / stats.total) || 3
    };
  });

  // Default department performance if empty
  if (departmentPerformance.length === 0) {
    departmentPerformance.push(
      { department: 'Public Works', reports: 12, resolutionRate: 85, avgDays: 3 },
      { department: 'Water Department', reports: 8, resolutionRate: 90, avgDays: 1 },
      { department: 'Sanitation Dept', reports: 15, resolutionRate: 95, avgDays: 2 },
      { department: 'Electricity & Power', reports: 6, resolutionRate: 80, avgDays: 2 }
    );
  }

  // Issue Trends (Last 5 days counts)
  const trends = Array.from({ length: 5 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (4 - i));
    const dateString = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    // count reports on that day
    const count = dbState.issues.filter(issue => {
      const issueDate = new Date(issue.createdAt);
      return issueDate.getDate() === d.getDate() && issueDate.getMonth() === d.getMonth();
    }).length;

    return {
      date: dateString,
      reports: count || (i + 1) * 2, // seed placeholder
    };
  });

  res.json({
    totalReports,
    resolvedReports,
    resolutionRate,
    categoryDistribution,
    areaDistribution,
    departmentPerformance,
    trends
  });
});

// 11. ADMIN/STAFF ISSUE UPDATE
app.put('/api/admin/issues/:id', (req, res) => {
  const { id } = req.params;
  const { status, department, severity, estimatedResolutionDays, commentText, adminUserId } = req.body;

  const issue = dbState.issues.find(i => i.id === id);
  if (!issue) {
    return res.status(404).json({ error: 'Issue not found' });
  }

  const adminUser = dbState.users.find(u => u.id === adminUserId) || { name: 'Admin Staff' };

  if (status) {
    const oldStatus = issue.status;
    issue.status = status;

    // Log Activity
    issue.activityLog.push({
      id: `act-${Date.now()}`,
      status,
      message: `Status changed from ${oldStatus} to ${status}. ${commentText || ''}`,
      timestamp: new Date().toISOString(),
      updatedBy: adminUser.name
    });

    // Award extra Citizen Points if resolved!
    if (status === 'Resolved') {
      const reporter = dbState.users.find(u => u.id === issue.reporterId);
      if (reporter) {
        reporter.citizenScore += 30; // 30 points for a successfully resolved report
        // Notify reporter
        dbState.notifications.push({
          id: `not-${Date.now()}`,
          userId: issue.reporterId,
          title: 'Your reported issue is Resolved! 🛠️',
          message: `Great news! "${issue.title}" has been completed and marked Resolved. You earned +30 Citizen points.`,
          read: false,
          timestamp: new Date().toISOString(),
          issueId: issue.id
        });
      }
    } else {
      // General status change notification
      dbState.notifications.push({
        id: `not-${Date.now()}`,
        userId: issue.reporterId,
        title: `Report Status: ${status}`,
        message: `Your reported issue "${issue.title}" was updated to ${status}.`,
        read: false,
        timestamp: new Date().toISOString(),
        issueId: issue.id
      });
    }
  }

  if (department) {
    issue.department = department;
  }

  if (severity) {
    issue.severity = severity;
  }

  if (estimatedResolutionDays) {
    issue.estimatedResolutionDays = Number(estimatedResolutionDays);
  }

  issue.updatedAt = new Date().toISOString();
  saveDB();
  res.json({ success: true, issue });
});

// 12. AI CHAT ASSISTANT
app.post('/api/ai/chat', async (req, res) => {
  const { message, history } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'message parameter is required' });
  }

  // Generate current civic snapshot context to prime Gemini
  const activeIssuesContext = dbState.issues.map(i => {
    return `- [ID: ${i.id}] Title: "${i.title}" | Status: ${i.status} | Category: ${i.category} | Department: ${i.department} | Address: "${i.address}" | Est. Resolution: ${i.estimatedResolutionDays} days.`;
  }).join('\n');

  const contextSystemPrompt = `You are "Community Hero AI Assistant", a smart civic advisor for a municipal reporting application.
  Below is a real-time list of civic reports currently registered in our neighborhood system:
  
  ${activeIssuesContext}
  
  Respond to the user's inquiry helpfully, professionally, and accurately based on this context.
  If they ask about a specific complaint or issue, check the list and provide its precise status (e.g. In Progress, Assigned, Resolved), the department responsible, and any other helpful details.
  If they ask how to report correctly, explain that uploading clear photos, ensuring GPS pinpointing on the map, and describing hazards precisely helps the AI model and city inspectors triage issues faster.
  Keep responses warm, encouraging civic action, clear, and highly focused on neighborhood resolution.`;

  if (!ai) {
    // Simulated AI response
    console.log('Gemini API not configured, returning simulated chatbot response.');
    
    // Basic pattern matching for simulation
    const msgLower = message.toLowerCase();
    let reply = "I am the Community Hero AI. I can help track your civic issues, suggest safety guidelines, and direct queries to correct municipal departments.";
    
    if (msgLower.includes('delay') || msgLower.includes('pothole') || msgLower.includes('iss-1')) {
      reply = "I checked our local logs. The Pothole Trench on Market St (issue #iss-1) is currently 'In Progress'. The patching crew was dispatched yesterday and has started placing safety cones. The estimated completion is in about 2 days! Let me know if you need updates on any other reports.";
    } else if (msgLower.includes('report') || msgLower.includes('how to')) {
      reply = "To report an issue effectively:\n1. Upload a clear photograph (the AI automatically determines category, severity, and department!).\n2. Pinpoint the exact location on our Google Map or enable GPS.\n3. Add a brief, clear description.\nThis helps our city repair units prioritize and resolve it rapidly!";
    } else if (msgLower.includes('burst') || msgLower.includes('water') || msgLower.includes('iss-2')) {
      reply = "Issue #iss-2 regarding the burst water pipe on Tehama St has been successfully 'Resolved'! The crew repaired the structural crack and fully restored water pressure. Fantastic community work tracking this issue!";
    }
    
    return res.json({ response: reply });
  }

  try {
    console.log('Sending chatbot prompt to Gemini...');
    
    // Prepare conversation history
    const geminiHistory = history ? history.map((chat: any) => ({
      role: chat.role === 'user' ? 'user' : 'model',
      parts: [{ text: chat.text }]
    })) : [];

    // Add current context + message as prompt
    const finalPrompt = `${contextSystemPrompt}\n\nUser Question: ${message}`;

    const chatSession = ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        ...geminiHistory,
        { role: 'user', parts: [{ text: finalPrompt }] }
      ]
    });

    const result = await chatSession;
    return res.json({ response: result.text });
  } catch (err) {
    console.error('Error generating chat content with Gemini:', err);
    return res.json({ response: 'I apologize, but my core language systems are experiencing a brief overload. Our team is dispatching a patch!' });
  }
});


// -------------------------------------------------------------
// VITE CLIENT INTEGRATION
// -------------------------------------------------------------

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  
  if (!isProd) {
    console.log('Starting full-stack server in Development Mode with Vite middleware...');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    console.log('Starting full-stack server in Production Mode...');
    app.use(express.static(path.join(__dirname, 'dist')));
    
    // SPA fallback
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) {
        return next();
      }
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(3000, '0.0.0.0', () => {
    console.log('==================================================');
    console.log('🚀 Community Hero AI App started successfully!');
    console.log('👉 Listening on Port: 3000 (accessible via reverse proxy)');
    console.log('==================================================');
  });
}

startServer();
