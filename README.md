# 🩸 MERN Blood Bank Management System

## 🚀 Enhanced Features & Production-Ready Improvements

A comprehensive blood bank management system built with the MERN stack, featuring advanced security, analytics, monitoring, and automation capabilities.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Security Features](#security-features)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [API Documentation](#api-documentation)
- [Monitoring & Analytics](#monitoring--analytics)
- [Automated Tasks](#automated-tasks)
- [Contributing](#contributing)

## ✨ Features

### Core Functionality

- **User Management**: Multi-role authentication (Donors, Hospitals, Organizations, Admin)
- **Blood Inventory**: Real-time blood inventory tracking with automatic expiry management
- **Donation Management**: Comprehensive donation tracking and history
- **Request System**: Hospital blood request management with notifications
- **Campaign & Events**: Organization event management with participant tracking
- **Partnership Management**: Hospital-organization partnership system

### Enhanced Features

- **📊 Analytics Dashboard**: Comprehensive data visualization and insights
- **🔒 Advanced Security**: Rate limiting, input validation, CORS protection
- **📧 Email Notifications**: Automated email system for various events
- **⚡ Real-time Monitoring**: Live application health monitoring
- **🤖 Automated Tasks**: Scheduled blood expiry checks and reminders
- **📱 Responsive Design**: Mobile-friendly interface
- **🔍 Global Error Handling**: Comprehensive error boundary and logging
- **📊 Data Export**: CSV/JSON export functionality

## 🛠 Tech Stack

### Backend

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database with Mongoose ODM
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **Winston** - Advanced logging
- **Nodemailer** - Email service
- **Node-cron** - Task scheduling
- **Helmet** - Security headers
- **Express-rate-limit** - Rate limiting
- **Express-validator** - Input validation

### Frontend

- **React 19** - UI framework
- **Redux Toolkit** - State management
- **React Router 7** - Navigation
- **Bootstrap 5** - Styling
- **Chart.js** - Data visualization
- **React-Chartjs-2** - Chart components
- **Axios** - HTTP client
- **React-Toastify** - Notifications

## 🏗 Architecture

```
MERN-Blood-Bank-App/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── redux/          # State management
│   │   ├── services/       # API services
│   │   └── utils/          # Utility functions
├── server/                 # Node.js backend
│   ├── controllers/        # Route handlers
│   ├── middleware/         # Custom middleware
│   ├── models/            # Database models
│   ├── routes/            # API routes
│   ├── utils/             # Utility functions
│   └── logs/              # Application logs
└── config/                # Configuration files
```

## 🔒 Security Features

### Authentication & Authorization

- JWT-based authentication with secure token management
- Role-based access control (RBAC)
- Password hashing with bcryptjs
- Session management with automatic logout

### Data Protection

- Input validation using express-validator
- SQL injection prevention with Mongoose
- XSS protection with helmet
- CORS configuration for secure cross-origin requests
- Rate limiting to prevent abuse

### Security Headers

- Content Security Policy (CSP)
- X-Frame-Options protection
- XSS filtering
- MIME type sniffing prevention

## 🚀 Installation

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- Git

### Backend Setup

```bash
# Clone the repository
git clone <repository-url>
cd MERN-Blood-Bank-App

# Install backend dependencies
npm install

# Set up environment variables (see below)
cp .env.example .env

# Start the backend server
npm run server
```

### Frontend Setup

```bash
# Navigate to client directory
cd client

# Install frontend dependencies
npm install

# Start the React development server
npm start
```

### Full Development Setup

```bash
# Run both frontend and backend concurrently
npm run dev
```

## 🌐 Environment Variables

Create a `.env` file in the root directory:

```env
# Database
MONGO_URL=mongodb://localhost:27017/bloodbank
# OR for MongoDB Atlas:
# MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/bloodbank

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-here

# Application Settings
PORT=8080
NODE_ENV=development
DEV_MODE=development

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# Email Configuration (optional)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=Blood Bank App <noreply@bloodbank.com>

# Logging Level
LOG_LEVEL=info
```

## 📡 API Documentation

### Authentication Endpoints

```
POST /api/v1/auth/register  # User registration
POST /api/v1/auth/login     # User login
GET  /api/v1/auth/current-user # Get current user
GET  /api/v1/auth/users     # Get users by role
```

### Inventory Management

```
GET    /api/v1/inventory/get-inventory    # Get blood inventory
POST   /api/v1/inventory/create-inventory # Add blood donation/request
GET    /api/v1/inventory/get-donar        # Get donors
GET    /api/v1/inventory/get-hospitals    # Get hospitals
```

### Analytics & Monitoring

```
GET /api/v1/analytics/analytics          # Get analytics data
GET /api/v1/analytics/metrics/realtime   # Get real-time metrics
GET /api/v1/analytics/export             # Export data
GET /api/v1/health                       # Health check endpoint
```

### Organization Management

```
GET  /api/v1/organization/dashboard       # Organization dashboard
POST /api/v1/organization/campaigns       # Create campaign
GET  /api/v1/organization/campaigns       # Get campaigns
POST /api/v1/organization/events          # Create event
GET  /api/v1/organization/events          # Get events
```

## 📊 Monitoring & Analytics

### Real-time Monitoring

- Application health checks with database connectivity
- Live blood inventory levels with critical alerts
- User activity tracking and session monitoring
- Performance metrics and error tracking

### Analytics Dashboard

- User registration trends and demographics
- Blood donation/request patterns by time and location
- Blood group distribution and demand analysis
- Organization and hospital performance metrics
- Export capabilities for external analysis

### Logging System

- Structured logging with Winston
- Separate log files for errors, combined logs, and exceptions
- Log rotation to manage file sizes
- Real-time log monitoring capabilities

## 🤖 Automated Tasks

### Scheduled Operations

- **Blood Expiry Check** (Daily 2 AM): Automatically mark expired blood units
- **Donation Reminders** (Weekly Monday 9 AM): Send reminders to eligible donors
- **Daily Reports** (Daily 11 PM): Generate comprehensive daily statistics
- **Database Backup** (Weekly Sunday 3 AM): Automated backup procedures

### Email Notifications

- Welcome emails for new user registrations
- Donation reminder emails to eligible donors
- Blood request confirmations for hospitals
- Event notifications for registered participants

## 🎨 User Interface Features

### Role-based Dashboards

- **Donors**: Personal donation history, upcoming camps, eligibility status
- **Hospitals**: Blood requests, inventory levels, donor network
- **Organizations**: Campaign management, event planning, partnership tracking
- **Admin**: System overview, user management, comprehensive analytics

### Responsive Design

- Mobile-first approach with Bootstrap 5
- Touch-friendly interface for tablets and phones
- Optimized performance across all device types
- Progressive Web App (PWA) capabilities

## 🔧 Development Features

### Code Quality

- ESLint configuration for consistent code style
- Error boundaries for graceful error handling
- Global state management with Redux Toolkit
- Modular component architecture

### Performance Optimization

- Code splitting and lazy loading
- Image optimization and compression
- Database query optimization
- Caching strategies for frequently accessed data

### Testing (Ready for Implementation)

- Unit test setup with Jest
- Integration testing framework
- End-to-end testing with Cypress
- API testing with Postman collections

## 🚀 Deployment

### Production Checklist

- [ ] Set NODE_ENV=production
- [ ] Configure MongoDB Atlas for production
- [ ] Set up SSL certificates
- [ ] Configure domain and DNS
- [ ] Set up monitoring and alerting
- [ ] Configure backup strategies
- [ ] Enable email service
- [ ] Set up CI/CD pipeline

### Docker Deployment (Ready)

```bash
# Build and run with Docker
docker-compose up --build
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Thanks to all contributors who helped improve this project
- MongoDB community for excellent documentation
- React and Node.js communities for continuous innovation
- Blood donation organizations for inspiration and requirements

## 📞 Support

For support, email [your-email@domain.com] or create an issue in this repository.

---

**Built with ❤️ for saving lives through technology**
