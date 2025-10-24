const mongoose = require('mongoose');

const metricSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
    index: true
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now
  },
  route: {
    path: {
      type: String,
      required: true,
      index: true
    },
    method: {
      type: String,
      required: true,
      enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
      index: true
    }
  },
  request: {
    ip: String,
    userAgent: String,
    userId: String, // If user is authenticated
    sessionId: String,
    referer: String,
    size: Number // Request size in bytes
  },
  response: {
    statusCode: {
      type: Number,
      required: true,
      index: true
    },
    size: Number, // Response size in bytes
    headers: mongoose.Schema.Types.Mixed
  },
  performance: {
    responseTime: {
      type: Number,
      required: true,
      index: true // For performance queries
    },
    cpuUsage: Number,
    memoryUsage: Number
  },
  error: {
    isError: {
      type: Boolean,
      default: false,
      index: true
    },
    message: String,
    stack: String,
    code: String
  },
  location: {
    country: String,
    region: String,
    city: String,
    timezone: String
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
metricSchema.index({ projectId: 1, timestamp: -1 });
metricSchema.index({ projectId: 1, 'route.path': 1, timestamp: -1 });
metricSchema.index({ projectId: 1, 'response.statusCode': 1, timestamp: -1 });
metricSchema.index({ projectId: 1, 'error.isError': 1, timestamp: -1 });
metricSchema.index({ timestamp: -1 }); // For cleanup queries

// TTL index to automatically delete old metrics
metricSchema.index({ timestamp: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 }); // 30 days

// Static methods for analytics
metricSchema.statics.getMetricsByTimeRange = function(projectId, startDate, endDate) {
  return this.find({
    projectId,
    timestamp: { $gte: startDate, $lte: endDate }
  }).sort({ timestamp: -1 });
};

metricSchema.statics.getRoutePerformance = function(projectId, timeRange = 24) {
  const startDate = new Date(Date.now() - timeRange * 60 * 60 * 1000);
  
  return this.aggregate([
    {
      $match: {
        projectId: new mongoose.Types.ObjectId(projectId),
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          path: '$route.path',
          method: '$route.method'
        },
        totalRequests: { $sum: 1 },
        avgResponseTime: { $avg: '$performance.responseTime' },
        maxResponseTime: { $max: '$performance.responseTime' },
        minResponseTime: { $min: '$performance.responseTime' },
        errorCount: {
          $sum: { $cond: ['$error.isError', 1, 0] }
        },
        successCount: {
          $sum: { $cond: ['$error.isError', 0, 1] }
        }
      }
    },
    {
      $addFields: {
        errorRate: {
          $multiply: [
            { $divide: ['$errorCount', '$totalRequests'] },
            100
          ]
        },
        successRate: {
          $multiply: [
            { $divide: ['$successCount', '$totalRequests'] },
            100
          ]
        }
      }
    },
    {
      $sort: { totalRequests: -1 }
    }
  ]);
};

module.exports = mongoose.model('Metric', metricSchema);
