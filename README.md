# Community Hero AI 🚀

An AI-powered hyperlocal civic issue reporting and resolution platform that enables citizens to report, verify, track, and resolve community problems using intelligent automation and Google AI.

Developed as part of the **Google AI Hackathon 2026**.

---

## 📌 Problem Statement

Communities frequently face civic issues such as potholes, water leakages, damaged streetlights, overflowing garbage, and other public infrastructure problems. Traditional reporting systems are fragmented, difficult to track, and often lack transparency.

**Community Hero AI** provides a centralized platform where citizens can report issues, collaborate with their community, and leverage AI-powered insights for faster resolution.

---

## ✨ Features

* 📸 AI-powered image-based issue reporting using Gemini Vision
* 🤖 Automatic issue categorization and severity detection
* 📍 Interactive map with location-based issue reporting
* 🔍 Duplicate issue detection to avoid redundant reports
* 🗳️ Community verification and validation
* 📊 Real-time impact analytics dashboard
* 👨‍💼 Admin dispatch and issue management console
* 💬 Context-aware AI chatbot for civic assistance
* 🏆 Gamified citizen leaderboard and badges
* 📈 Smart insights and issue tracking

---

## 🛠️ Tech Stack

### Frontend

* React 19
* TypeScript
* Vite
* Tailwind CSS
* Motion
* Lucide React

### Backend

* Node.js
* Express.js
* TypeScript

### AI

* Google Gemini 2.5 Flash
* Google AI Studio
* @google/genai SDK

### Mapping

* Interactive Map Component
* Geolocation Support

### Database

* Local JSON-based persistent storage (db.json)

---

## ☁️ Google Technologies Used

* Google AI Studio
* Gemini 2.5 Flash
* Google Cloud Run (Deployment)
* Gemini Vision API

---

## 🧠 AI Workflow

1. Citizen uploads an image.
2. Gemini Vision analyzes the image.
3. AI identifies:

   * Issue Category
   * Severity
   * Responsible Department
   * Confidence Score
   * Estimated Resolution Time
4. Duplicate detection checks nearby reports.
5. Community verifies the issue.
6. Admin dispatches the appropriate department.
7. Citizens receive real-time status updates.

---

## 📂 Project Structure

```
community-hero-ai/
│
├── src/
│   ├── components/
│   ├── pages/
│   ├── services/
│   ├── hooks/
│   └── assets/
│
├── server.ts
├── db.json
├── public/
├── package.json
└── README.md
```

---

## 🚀 Getting Started

### Clone Repository

```bash
git clone https://github.com/YOUR_USERNAME/community-hero-ai.git
cd community-hero-ai
```

### Install Dependencies

```bash
npm install
```

### Create Environment File

Create a `.env` file in the project root.

```env
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
APP_URL="http://localhost:3000"
```

### Run the Application

```bash
npm run dev
```

Open:

```
http://localhost:3000
```

---

## 📦 Build

```bash
npm run build
```

---

## 🌐 Deployment

The application is designed for deployment on **Google Cloud Run**.

---

## 📊 Future Enhancements

* Firebase Authentication
* Google Maps Platform integration
* Cloud SQL / Firestore
* Push Notifications
* Predictive AI analytics
* Real-time collaboration
* Mobile application

---

## 👥 Team

Developed for the **Google AI Hackathon 2026**.

---

## 📜 License

This project is developed for educational and hackathon purposes.
