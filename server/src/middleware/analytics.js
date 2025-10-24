const Metric = require('../models/Metric');
const Project = require('../models/Project');

// Analytics collection middleware
const collectAnalytics = async (req, res, next) => {
  const startTime = Date.now();
  const originalSend = res.send;
  
  // Override res.send to capture response data
  res.send = function(data) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    // Capture analytics data
    const analyticsData = {
      projectId: req.projectId,
      timestamp: new Date(),
      route: {
        path: req.route?.path || req.path,
        method: req.method
      },
      request: {
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        userId: req.user?.id,
        sessionId: req.sessionID,
        referer: req.get('Referer'),
        size: req.get('Content-Length') || 0
      },
      response: {
        statusCode: res.statusCode,
        size: Buffer.byteLength(data, 'utf8'),
        headers: {
          'content-type': res.get('Content-Type'),
          'content-length': res.get('Content-Length')
        }
      },
      performance: {
        responseTime: responseTime
      },
      error: {
        isError: res.statusCode >= 400,
        message: res.statusCode >= 400 ? `HTTP ${res.statusCode}` : null
      }
    };
    
    // Save analytics data asynchronously (don't block response)
    setImmediate(async () => {
      try {
        await Metric.create(analyticsData);
        
        // Emit real-time update via Socket.io
        if (req.app.get('io')) {
          req.app.get('io').to(`project-${req.projectId}`).emit('metric-update', {
            type: 'request',
            data: {
              route: analyticsData.route,
              responseTime: responseTime,
              statusCode: res.statusCode,
              timestamp: analyticsData.timestamp
            }
          });
        }
      } catch (error) {
        console.error('Analytics collection error:', error);
      }
    });
    
    // Call original send
    originalSend.call(this, data);
  };
  
  next();
};

// Project validation middleware
const validateProject = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'] || req.query.apiKey;
    
    if (!apiKey) {
      return res.status(401).json({
        success: false,
        message: 'API key is required'
      });
    }
    
    const project = await Project.findOne({ 
      apiKey, 
      isActive: true 
    });
    
    if (!project) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or inactive API key'
      });
    }
    
    req.projectId = project._id;
    req.project = project;
    next();
    
  } catch (error) {
    console.error('Project validation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error in project validation'
    });
  }
};

// Rate limiting per project
const projectRateLimit = (windowMs = 15 * 60 * 1000, max = 1000) => {
  const requests = new Map();
  
  return (req, res, next) => {
    const projectId = req.projectId;
    const now = Date.now();
    const windowStart = now - windowMs;
    
    if (!requests.has(projectId)) {
      requests.set(projectId, []);
    }
    
    const projectRequests = requests.get(projectId);
    
    // Remove old requests outside the window
    const validRequests = projectRequests.filter(time => time > windowStart);
    requests.set(projectId, validRequests);
    
    if (validRequests.length >= max) {
      return res.status(429).json({
        success: false,
        message: 'Rate limit exceeded for this project',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
    
    // Add current request
    validRequests.push(now);
    requests.set(projectId, validRequests);
    
    next();
  };
};

module.exports = {
  collectAnalytics,
  validateProject,
  projectRateLimit
};
