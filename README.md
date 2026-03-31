# NetZeroWorks

A comprehensive carbon accounting and compliance platform for tracking emissions, managing CBAM imports, and generating regulatory reports.

## 🌟 Features

- **Emission Tracking**: Log and monitor Scope 1, 2, and 3 emissions
- **CBAM Manager**: Track Carbon Border Adjustment Mechanism imports with EU default emission factors
- **AI Insights**: Get reduction recommendations powered by Google Gemini
- **Reports**: Generate SECR and CBAM compliance reports
- **Dashboard**: Visualize emissions trends and analytics
- **Scenario Planning**: Model future emission scenarios

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Python 3.10+** - [Download](https://www.python.org/downloads/)
- **Node.js 18+** - [Download](https://nodejs.org/)
- **PostgreSQL 14+** - [Download](https://www.postgresql.org/download/)
- **Git** - [Download](https://git-scm.com/downloads)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd netzero
```

### 2. Database Setup

Create a PostgreSQL database:

```bash
# Login to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE netzeroworks;

# Exit psql
\q
```

### 3. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# On Windows:
.venv\Scripts\activate
# On macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file from example
cp .env.example .env

# Edit .env file with your configuration
# Update DATABASE_URL, SECRET_KEY, and API keys
```

#### Configure Environment Variables

Edit `backend/.env`:

```env
# Database
DATABASE_URL=postgresql+asyncpg://postgres:your_password@localhost:5432/netzeroworks

# Auth (generate a secure secret key)
SECRET_KEY=your-super-secret-key-change-this
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=7

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:8000/api/auth/google/callback

# Google Gemini API (for AI insights)
GEMINI_API_KEY=your-gemini-api-key

# Frontend
FRONTEND_URL=http://localhost:5173

# File uploads
UPLOAD_DIR=./uploads
```

#### Generate a Secret Key

```bash
# Generate a secure secret key
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

#### Start the Backend Server

```bash
# Make sure you're in the backend directory with venv activated
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The backend will be available at `http://localhost:8000`

**Note**: On first startup, the server will automatically seed emission factors (DEFRA and CBAM). This may take a few seconds. Subsequent startups will be instant.

### 4. Frontend Setup

Open a new terminal:

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:5173`

## 🗂️ Project Structure

```
netzero/
├── backend/
│   ├── app/
│   │   ├── config/          # Database and settings configuration
│   │   ├── controllers/     # API route handlers
│   │   ├── middleware/      # Authentication middleware
│   │   ├── models/          # SQLAlchemy database models
│   │   ├── schemas/         # Pydantic validation schemas
│   │   ├── seeders/         # Database seeders (DEFRA, CBAM factors)
│   │   ├── services/        # Business logic layer
│   │   └── main.py          # FastAPI application entry point
│   ├── uploads/             # User uploaded files
│   ├── .env.example         # Environment variables template
│   ├── requirements.txt     # Python dependencies
│   └── README.md
├── frontend/
│   ├── src/
│   │   ├── api/             # API client configuration
│   │   ├── components/      # React components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── pages/           # Page components
│   │   ├── services/        # API service functions
│   │   ├── types/           # TypeScript type definitions
│   │   └── utils/           # Utility functions
│   ├── package.json         # Node dependencies
│   └── vite.config.js       # Vite configuration
└── README.md                # This file
```

## 🔧 Configuration

### Backend Configuration

Key configuration files:
- `backend/.env` - Environment variables
- `backend/app/config/settings.py` - Application settings
- `backend/app/config/database.py` - Database configuration

### Frontend Configuration

Key configuration files:
- `frontend/vite.config.js` - Vite build configuration
- `frontend/tailwind.config.js` - Tailwind CSS configuration
- `frontend/tsconfig.json` - TypeScript configuration

## 📊 Database

The application uses PostgreSQL with SQLAlchemy ORM. Database tables are automatically created on first startup.

### Seeded Data

The following emission factors are automatically seeded:
- **DEFRA 2024 Factors**: Scope 1, 2, and 3 emission factors for UK reporting
- **CBAM Default Values**: EU Carbon Border Adjustment Mechanism emission factors for imports

## 🔐 Authentication

The application supports:
- Email/password authentication
- Google OAuth (optional - requires configuration)
- JWT-based session management

## 🧪 API Documentation

Once the backend is running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## 📝 Available Scripts

### Backend

```bash
# Start development server
python -m uvicorn app.main:app --reload

# Run with specific host/port
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000

# Seed emission factors manually (if needed)
python seed_factors.py
python seed_cbam_factors.py
```

### Frontend

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🐛 Troubleshooting

### Backend Issues

**Database connection error:**
- Ensure PostgreSQL is running
- Verify DATABASE_URL in `.env` is correct
- Check database exists: `psql -U postgres -l`

**Module not found:**
- Ensure virtual environment is activated
- Reinstall dependencies: `pip install -r requirements.txt`

**Port already in use:**
- Change port: `uvicorn app.main:app --port 8001`

### Frontend Issues

**Dependencies installation fails:**
- Clear npm cache: `npm cache clean --force`
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`

**Port 5173 already in use:**
- Vite will automatically use the next available port
- Or specify port: `npm run dev -- --port 3000`

## 🌐 Environment Variables

### Required Backend Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql+asyncpg://user:pass@localhost:5432/db` |
| `SECRET_KEY` | JWT signing key | Generate with `secrets.token_urlsafe(32)` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:5173` |

### Optional Backend Variables

| Variable | Description | Required For |
|----------|-------------|--------------|
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | Google login |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret | Google login |
| `GEMINI_API_KEY` | Google Gemini API key | AI insights |

## 📦 Deployment

### Backend Deployment

1. Set production environment variables
2. Use a production WSGI server (e.g., Gunicorn)
3. Set up PostgreSQL database
4. Configure reverse proxy (Nginx/Apache)

```bash
# Example with Gunicorn
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker
```

### Frontend Deployment

1. Build the production bundle:
```bash
npm run build
```

2. Deploy the `dist` folder to your hosting service (Vercel, Netlify, etc.)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📄 License

This project is proprietary software. All rights reserved.

## 🆘 Support

For issues and questions:
- Create an issue in the repository
- Contact the development team

## 🔄 Version History

- **v1.0.0** - Initial release
  - Emission tracking (Scope 1, 2, 3)
  - CBAM import management
  - Dashboard and analytics
  - Report generation
  - AI-powered insights

---

Built with ❤️ for a sustainable future
