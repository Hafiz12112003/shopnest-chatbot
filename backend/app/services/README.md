# 🛍️ ShopNest AI Customer Support Chatbot

A modern, production-ready AI-powered customer support chatbot system built for e-commerce platforms.

![ShopNest](https://img.shields.io/badge/ShopNest-AI%20Chatbot-blue)
![Python](https://img.shields.io/badge/Python-3.12-green)
![React](https://img.shields.io/badge/React-18-blue)
![Flask](https://img.shields.io/badge/Flask-3.1-red)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green)

## 🚀 Live Demo
- Frontend: http://localhost:5173
- Backend API: http://127.0.0.1:5000/api/health

## ✨ Features

### 🤖 AI Chatbot
- Powered by Groq API (Llama 3.3 70B model)
- Context-aware conversation memory
- Human-like responses
- Typing animation indicator
- Auto-saves all conversations

### 🔐 Authentication
- JWT-based secure authentication
- User registration and login
- Password hashing with bcrypt
- Protected routes
- Role-based access (Admin/User)

### 📚 FAQ Knowledge Base
- Admin can add/edit/delete FAQs
- AI searches FAQs before generating responses
- Category-based organization
- Smart keyword matching

### 💬 Chat System
- Real-time AI responses
- Full conversation history
- Multiple chat sessions
- Delete conversations
- Auto-titled chats

### 👨‍💼 Admin Dashboard
- User management
- Chat monitoring
- FAQ management
- Analytics overview
- Total users, chats, messages stats

### 🎨 Modern UI/UX
- Dark theme design
- Framer Motion animations
- Fully responsive
- Toast notifications
- Clean professional layout

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js + Vite |
| Styling | Tailwind CSS |
| Animations | Framer Motion |
| Backend | Python Flask |
| Database | MongoDB Atlas |
| AI Model | Groq (Llama 3.3 70B) |
| Auth | JWT + bcrypt |
| HTTP Client | Axios |

## 📁 Project Structure
shopnest-chatbot/
├── backend/
│   ├── app/
│   │   ├── routes/
│   │   │   ├── auth.py      # Authentication APIs
│   │   │   ├── chat.py      # Chat APIs
│   │   │   ├── faq.py       # FAQ APIs
│   │   │   └── admin.py     # Admin APIs
│   │   ├── services/
│   │   │   └── ai_service.py  # Groq AI integration
│   │   └── utils/
│   │       └── database.py    # MongoDB connection
│   ├── .env                   # Environment variables
│   ├── requirements.txt
│   └── run.py
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Chat.jsx
│   │   │   └── Admin.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   └── services/
│   │       └── api.js
│   └── package.json
└── README.md

## ⚙️ Installation & Setup

### Prerequisites
- Python 3.12+
- Node.js 18+
- MongoDB Atlas account
- Groq API key (free at console.groq.com)

### Backend Setup

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment (Windows)
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Add your GROQ_API_KEY and MONGO_URI

# Run the server
python run.py
```

### Frontend Setup

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Run the development server
npm run dev
```

### Environment Variables

Create `backend/.env`:

```env
FLASK_ENV=development
SECRET_KEY=your-secret-key
JWT_SECRET_KEY=your-jwt-secret
MONGO_URI=your-mongodb-atlas-uri
GROQ_API_KEY=your-groq-api-key
FRONTEND_URL=http://localhost:5173
```

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login user |
| GET | /api/auth/me | Get current user |

### Chat
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/chat/new | Create new chat |
| POST | /api/chat/message | Send message |
| GET | /api/chat/history/:id | Get chat history |
| GET | /api/chat/my-chats | Get all user chats |
| DELETE | /api/chat/delete/:id | Delete chat |

### FAQ
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/faq/ | Get all FAQs |
| POST | /api/faq/ | Create FAQ (admin) |
| DELETE | /api/faq/:id | Delete FAQ (admin) |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/admin/stats | Get statistics |
| GET | /api/admin/users | Get all users |
| GET | /api/admin/chats | Get all chats |

## 👤 Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@shopnest.com | admin123 |
| User | test@shopnest.com | test123 |

## 🤖 AI Flow
User sends message
↓
Backend searches FAQ database
↓
Relevant FAQs found? → Inject as context
↓
Send to Groq AI (Llama 3.3 70B)
↓
AI generates human-like response
↓
Save to MongoDB
↓
Return response to frontend

## 🚀 Deployment

### Frontend → Vercel
```bash
cd frontend
npm run build
# Deploy dist/ folder to Vercel
```

### Backend → Render
```bash
# Set environment variables in Render dashboard
# Connect GitHub repository
# Build command: pip install -r requirements.txt
# Start command: gunicorn run:app
```

## 📝 Future Improvements
- Real-time chat with WebSockets
- Voice input support
- Sentiment analysis
- Multi-language support
- Email notifications
- Chat export feature
- Mobile app

## 👨‍💻 Developer
**Muhammad Hafiz**
- B.Tech Information Technology
- Full Stack Developer
- AI Integration Specialist

## 📄 License
MIT License