# 🚀 Insightify Server

Real-time analytics dashboard backend for API performance monitoring.

## 📋 Features

- **User Authentication**: JWT-based auth with registration/login
- **Project Management**: Create and manage API projects
- **Real-time Analytics**: Track API performance metrics
- **Route Analysis**: Detailed endpoint performance insights
- **Error Tracking**: Comprehensive error monitoring and analysis
- **WebSocket Support**: Live dashboard updates
- **Rate Limiting**: Protect against abuse
- **Security**: Helmet, CORS, input validation

## 🛠️ Tech Stack

- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Real-time**: Socket.io
- **Authentication**: JWT + bcrypt
- **Security**: Helmet, CORS, Rate Limiting
- **Monitoring**: Morgan logging

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud)
- npm or yarn

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

3. **Start MongoDB** (if running locally):
   ```bash
   mongod
   ```

4. **Run the server**:
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

5. **Test the server**:
   ```bash
   node test-server.js
   ```

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user
- `PUT /api/auth/profile` - Update user profile

### Projects
- `GET /api/projects` - Get user's projects
- `POST /api/projects` - Create new project
- `GET /api/projects/:id` - Get specific project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project
- `POST /api/projects/:id/regenerate-key` - Regenerate API key
- `GET /api/projects/:id/stats` - Get project statistics

### Analytics
- `POST /api/analytics/track` - Track API metrics (requires API key)
- `GET /api/analytics/realtime/:projectId` - Get real-time metrics
- `GET /api/analytics/routes/:projectId` - Get route performance
- `GET /api/analytics/errors/:projectId` - Get error analysis
- `GET /api/analytics/trends/:projectId` - Get historical trends

## 🔧 Configuration

### Environment Variables

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/insightify

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRE=7d

# Client
CLIENT_URL=http://localhost:5173

# Redis (optional)
REDIS_URL=redis://localhost:6379

# Email (for reports)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

## 📈 Analytics Integration

### For Your API

Add the analytics tracking to your existing API:

```javascript
// Example: Express.js middleware
app.use('/api', (req, res, next) => {
  // Your existing middleware
  next();
});

// Analytics tracking
app.use('/api', async (req, res, next) => {
  const startTime = Date.now();
  
  // Track the request
  await fetch('http://localhost:5000/api/analytics/track', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': 'your-project-api-key'
    },
    body: JSON.stringify({
      route: {
        path: req.path,
        method: req.method
      },
      request: {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      },
      response: {
        statusCode: res.statusCode
      },
      performance: {
        responseTime: Date.now() - startTime
      }
    })
  });
});
```

### SDK Integration

```javascript
// Install the Insightify SDK
npm install @insightify/sdk

// Initialize
const Insightify = require('@insightify/sdk');
const analytics = new Insightify({
  apiKey: 'your-project-api-key',
  endpoint: 'http://localhost:5000'
});

// Track requests
app.use(analytics.middleware());
```

## 🔒 Security Features

- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: bcrypt with salt rounds
- **Rate Limiting**: Prevent API abuse
- **CORS Protection**: Configured for frontend
- **Helmet**: Security headers
- **Input Validation**: Request validation
- **API Key Protection**: Secure project access

## 📊 Database Schema

### Users
- Authentication and profile data
- Preferences and settings
- Role-based access

### Projects
- API project configuration
- API keys for tracking
- Settings and thresholds

### Metrics
- Real-time performance data
- Request/response details
- Error tracking
- Performance metrics

## 🧪 Testing

Run the test suite:
```bash
node test-server.js
```

This will test:
- Server health
- User registration/login
- Project creation
- Analytics tracking
- Statistics retrieval

## 🚀 Deployment

### Production Setup

1. **Environment**:
   ```bash
   NODE_ENV=production
   MONGODB_URI=mongodb://your-production-db
   JWT_SECRET=your-production-secret
   ```

2. **Process Manager**:
   ```bash
   npm install -g pm2
   pm2 start src/index.js --name insightify
   ```

3. **Reverse Proxy** (Nginx):
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

## 📝 Development

### Project Structure
```
src/
├── config/          # Database configuration
├── middleware/       # Custom middleware
├── models/          # Database models
├── routes/          # API routes
└── index.js         # Server entry point
```

### Adding New Features

1. **Models**: Add to `src/models/`
2. **Routes**: Add to `src/routes/`
3. **Middleware**: Add to `src/middleware/`
4. **Tests**: Update `test-server.js`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

---

**Insightify** - Real-time API Analytics Dashboard 🚀
