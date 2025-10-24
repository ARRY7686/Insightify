const express = require('express');
const Metric = require('../models/Metric');
const Project = require('../models/Project');
const { protect } = require('../middleware/auth');
const { validateProject, collectAnalytics, projectRateLimit } = require('../middleware/analytics');

const router = express.Router();

// @desc    Analytics endpoint for tracking API calls
// @route   POST /api/analytics/track
// @access  Public (with API key)
const trackAnalytics = [
  validateProject,
  projectRateLimit(15 * 60 * 1000, 1000), // 1000 requests per 15 minutes
  collectAnalytics,
  (req, res) => {
    res.json({
      success: true,
      message: 'Analytics tracked successfully'
    });
  }
];

// @desc    Get real-time metrics for dashboard
// @route   GET /api/analytics/realtime/:projectId
// @access  Private
const getRealtimeMetrics = async (req, res) => {
  try {
    const projectId = req.params.projectId;
    
    // Verify project ownership
    const project = await Project.findOne({
      _id: projectId,
      owner: req.user.id
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const timeRange = req.query.range || '1'; // hours
    const startDate = new Date(Date.now() - timeRange * 60 * 60 * 1000);

    // Get metrics for the time range
    const metrics = await Metric.find({
      projectId,
      timestamp: { $gte: startDate }
    }).sort({ timestamp: -1 }).limit(1000);

    // Calculate real-time stats
    const totalRequests = metrics.length;
    const errorCount = metrics.filter(m => m.error.isError).length;
    const avgResponseTime = metrics.reduce((sum, m) => sum + m.performance.responseTime, 0) / totalRequests || 0;

    // Group by time intervals for chart data
    const interval = Math.max(1, Math.floor(timeRange * 60 / 20)); // 20 data points max
    const timeIntervals = {};
    
    metrics.forEach(metric => {
      const timeKey = new Date(Math.floor(metric.timestamp.getTime() / (interval * 60 * 1000)) * (interval * 60 * 1000));
      if (!timeIntervals[timeKey]) {
        timeIntervals[timeKey] = {
          requests: 0,
          errors: 0,
          avgResponseTime: 0,
          responseTimes: []
        };
      }
      timeIntervals[timeKey].requests++;
      if (metric.error.isError) timeIntervals[timeKey].errors++;
      timeIntervals[timeKey].responseTimes.push(metric.performance.responseTime);
    });

    // Calculate averages for each interval
    Object.keys(timeIntervals).forEach(key => {
      const interval = timeIntervals[key];
      interval.avgResponseTime = interval.responseTimes.reduce((sum, time) => sum + time, 0) / interval.responseTimes.length;
      interval.errorRate = (interval.errors / interval.requests) * 100;
      delete interval.responseTimes;
    });

    res.json({
      success: true,
      data: {
        summary: {
          totalRequests,
          errorCount,
          errorRate: totalRequests > 0 ? (errorCount / totalRequests * 100).toFixed(2) : 0,
          avgResponseTime: Math.round(avgResponseTime)
        },
        timeSeries: Object.entries(timeIntervals).map(([time, data]) => ({
          time: new Date(time),
          ...data
        })).sort((a, b) => new Date(a.time) - new Date(b.time))
      }
    });
  } catch (error) {
    console.error('Get realtime metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching realtime metrics'
    });
  }
};

// @desc    Get route performance analysis
// @route   GET /api/analytics/routes/:projectId
// @access  Private
const getRoutePerformance = async (req, res) => {
  try {
    const projectId = req.params.projectId;
    const timeRange = req.query.range || '24'; // hours

    // Verify project ownership
    const project = await Project.findOne({
      _id: projectId,
      owner: req.user.id
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const routeStats = await Metric.getRoutePerformance(projectId, timeRange);

    res.json({
      success: true,
      data: routeStats
    });
  } catch (error) {
    console.error('Get route performance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching route performance'
    });
  }
};

// @desc    Get error analysis
// @route   GET /api/analytics/errors/:projectId
// @access  Private
const getErrorAnalysis = async (req, res) => {
  try {
    const projectId = req.params.projectId;
    const timeRange = req.query.range || '24'; // hours
    const startDate = new Date(Date.now() - timeRange * 60 * 60 * 1000);

    // Verify project ownership
    const project = await Project.findOne({
      _id: projectId,
      owner: req.user.id
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Get error metrics
    const errorMetrics = await Metric.find({
      projectId,
      timestamp: { $gte: startDate },
      'error.isError': true
    }).sort({ timestamp: -1 });

    // Group errors by type and route
    const errorGroups = {};
    errorMetrics.forEach(metric => {
      const key = `${metric.route.method} ${metric.route.path}`;
      if (!errorGroups[key]) {
        errorGroups[key] = {
          route: metric.route,
          count: 0,
          errors: []
        };
      }
      errorGroups[key].count++;
      errorGroups[key].errors.push({
        timestamp: metric.timestamp,
        statusCode: metric.response.statusCode,
        message: metric.error.message
      });
    });

    res.json({
      success: true,
      data: {
        totalErrors: errorMetrics.length,
        errorGroups: Object.values(errorGroups).sort((a, b) => b.count - a.count)
      }
    });
  } catch (error) {
    console.error('Get error analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching error analysis'
    });
  }
};

// @desc    Get historical trends
// @route   GET /api/analytics/trends/:projectId
// @access  Private
const getHistoricalTrends = async (req, res) => {
  try {
    const projectId = req.params.projectId;
    const period = req.query.period || '7d'; // 7 days, 30d, 90d
    const metric = req.query.metric || 'requests'; // requests, errors, responseTime

    // Verify project ownership
    const project = await Project.findOne({
      _id: projectId,
      owner: req.user.id
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Calculate date range
    let days;
    switch (period) {
      case '7d': days = 7; break;
      case '30d': days = 30; break;
      case '90d': days = 90; break;
      default: days = 7;
    }

    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

    // Aggregate data by day
    const pipeline = [
      {
        $match: {
          projectId: projectId,
          timestamp: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$timestamp' },
            month: { $month: '$timestamp' },
            day: { $dayOfMonth: '$timestamp' }
          },
          totalRequests: { $sum: 1 },
          totalErrors: {
            $sum: { $cond: ['$error.isError', 1, 0] }
          },
          avgResponseTime: { $avg: '$performance.responseTime' },
          maxResponseTime: { $max: '$performance.responseTime' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ];

    const trends = await Metric.aggregate(pipeline);

    res.json({
      success: true,
      data: {
        period,
        metric,
        trends: trends.map(trend => ({
          date: new Date(trend._id.year, trend._id.month - 1, trend._id.day),
          totalRequests: trend.totalRequests,
          totalErrors: trend.totalErrors,
          errorRate: trend.totalRequests > 0 ? (trend.totalErrors / trend.totalRequests * 100).toFixed(2) : 0,
          avgResponseTime: Math.round(trend.avgResponseTime),
          maxResponseTime: trend.maxResponseTime
        }))
      }
    });
  } catch (error) {
    console.error('Get historical trends error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching historical trends'
    });
  }
};

// Routes
router.post('/track', trackAnalytics);
router.get('/realtime/:projectId', protect, getRealtimeMetrics);
router.get('/routes/:projectId', protect, getRoutePerformance);
router.get('/errors/:projectId', protect, getErrorAnalysis);
router.get('/trends/:projectId', protect, getHistoricalTrends);

module.exports = router;
