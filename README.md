# Smart Helpdesk System

A modern, AI-powered helpdesk solution for campus and organizational issue management. 
Built with the MERN stack (MongoDB, Express, React, Node.js), featuring a stunning glassmorphism UI, Framer Motion animations, and Google Gemini AI integration.

## 🚀 Features

- **Role-Based Access Control:** Secure authentication with distinct `Student`, `Staff`, and `Admin` roles.
- **Smart AI Integration:** Google Gemini API analyzes tickets, generates automated suggestions for users, and highlights sensitive/urgent issues.
- **Complete Ticket Lifecycle:** Create, track, filter, and respond to support tickets.
- **Admin Dashboard:** Centralized panel for managing users, tickets, campus notices, and FAQs.
- **Real-time Notifications:** Polling-based notification system to keep users updated on ticket statuses and AI responses.
- **Interactive Chatbot:** A built-in AI assistant to answer user queries dynamically.
- **Modern UI/UX:** Responsive design, Dark/Light mode, Glassmorphism elements, and smooth micro-interactions.

---

## 🛠️ Tech Stack

**Frontend:**
- React (Vite)
- Tailwind CSS v3
- Framer Motion (Animations)
- Lucide React (Icons)
- React Router DOM
- Date-fns (Time formatting)

**Backend:**
- Node.js & Express
- MongoDB & Mongoose
- JSON Web Tokens (JWT) & bcrypt (Auth in `httpOnly` cookies)
- Google Generative AI (`@google/generative-ai`)

---

## ⚙️ Installation & Setup

### Prerequisites
- Node.js (v18+)
- MongoDB connection string
- Google Gemini API Key

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd "smart helpdest system"
```

### 2. Backend Setup
```bash
cd server
npm install
```
- Copy `.env.example` to `.env` inside the `server/` directory and fill in the values:
  - `MONGODB_URI`
  - `JWT_SECRET`
  - `GEMINI_API_KEY`
- Start the backend server:
```bash
npm run dev
```
*The server will start on http://localhost:5000*

### 3. Frontend Setup
Open a new terminal window:
```bash
cd client
npm install
```
- Copy `.env.example` to `.env` inside the `client/` directory and ensure it points to the backend:
  - `VITE_API_URL=http://localhost:5000`
- Start the frontend development server:
```bash
npm run dev
```
*The React app will be available at http://localhost:3000*

---

## 🧪 Testing the Application

### 1. Register & Login
- Go to `http://localhost:3000/auth` and register a new account.
- The first user might default to `student`. To test admin capabilities, either modify the MongoDB document directly or use predefined seeds if you set them up.

### 2. Student Flow
- Navigate to the **Dashboard** to view personal stats.
- Click **Create Ticket**, enter details, and click **Get AI Suggestion** to test Gemini.
- Submit the ticket and check the **Notifications Bell** for the confirmation.

### 3. Admin Flow
- Log in with an `admin` role.
- Navigate to the **Admin Panel** (`/admin`).
- Reply to tickets, update statuses, manage users, and post **Notices** or **FAQs**.

### 4. Public Features
- View **Notices** and **FAQs** from the top navigation.
- Click the **Floating Chatbot Button** (bottom right) to ask the AI assistant questions.

---

## 🔒 Security Notes
- Passwords are hashed using `bcrypt`.
- Authentication uses secure, `httpOnly` cookies to prevent XSS attacks.
- Sensitive environment variables are stored in `.env` and ignored in `.gitignore`.

---
*Built as a comprehensive solution for streamlined campus support.*
