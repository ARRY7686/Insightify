const express = require('express');
const Project = require('../models/Project');
const Metric = require('../models/Metric');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @desc    Get all projects for user
// @route   GET /api/projects
// @access  Private
const getProjects = async (req, res) => {
  try {
    const projects = await Project.find({ owner: req.user.id })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: projects.length,
      data: projects
    });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching projects'
    });
  }
};

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Private
const getProject = async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      owner: req.user.id
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    res.json({
      success: true,
      data: project
    });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching project'
    });
  }
};

// @desc    Create new project
// @route   POST /api/projects
// @access  Private
const createProject = async (req, res) => {
  try {
    const { name, description, domains, tags, settings } = req.body;

    // Validation
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Project name is required'
      });
    }

    const project = await Project.create({
      name,
      description,
      domains,
      tags,
      settings,
      owner: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: project
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating project'
    });
  }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private
const updateProject = async (req, res) => {
  try {
    const { name, description, domains, tags, settings } = req.body;

    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, owner: req.user.id },
      { name, description, domains, tags, settings },
      { new: true, runValidators: true }
    );

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    res.json({
      success: true,
      message: 'Project updated successfully',
      data: project
    });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating project'
    });
  }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private
const deleteProject = async (req, res) => {
  try {
    const project = await Project.findOneAndDelete({
      _id: req.params.id,
      owner: req.user.id
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Delete all metrics for this project
    await Metric.deleteMany({ projectId: req.params.id });

    res.json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting project'
    });
  }
};

// @desc    Regenerate API key
// @route   POST /api/projects/:id/regenerate-key
// @access  Private
const regenerateApiKey = async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      owner: req.user.id
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Generate new API key
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let newApiKey = 'isk_';
    for (let i = 0; i < 32; i++) {
      newApiKey += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    project.apiKey = newApiKey;
    await project.save();

    res.json({
      success: true,
      message: 'API key regenerated successfully',
      data: { apiKey: newApiKey }
    });
  } catch (error) {
    console.error('Regenerate API key error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while regenerating API key'
    });
  }
};

// @desc    Get project statistics
// @route   GET /api/projects/:id/stats
// @access  Private
const getProjectStats = async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      owner: req.user.id
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const timeRange = req.query.range || '24'; // hours
    const startDate = new Date(Date.now() - timeRange * 60 * 60 * 1000);

    // Get basic metrics
    const totalRequests = await Metric.countDocuments({
      projectId: req.params.id,
      timestamp: { $gte: startDate }
    });

    const errorCount = await Metric.countDocuments({
      projectId: req.params.id,
      timestamp: { $gte: startDate },
      'error.isError': true
    });

    const avgResponseTime = await Metric.aggregate([
      {
        $match: {
          projectId: req.params.id,
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          avgResponseTime: { $avg: '$performance.responseTime' }
        }
      }
    ]);

    const routeStats = await Metric.getRoutePerformance(req.params.id, timeRange);

    res.json({
      success: true,
      data: {
        totalRequests,
        errorCount,
        errorRate: totalRequests > 0 ? (errorCount / totalRequests * 100).toFixed(2) : 0,
        avgResponseTime: avgResponseTime[0]?.avgResponseTime || 0,
        routeStats
      }
    });
  } catch (error) {
    console.error('Get project stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching project statistics'
    });
  }
};

// Routes
router.get('/', protect, getProjects);
router.get('/:id', protect, getProject);
router.post('/', protect, createProject);
router.put('/:id', protect, updateProject);
router.delete('/:id', protect, deleteProject);
router.post('/:id/regenerate-key', protect, regenerateApiKey);
router.get('/:id/stats', protect, getProjectStats);

module.exports = router;
