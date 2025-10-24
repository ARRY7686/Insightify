const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Project name is required'],
    trim: true,
    maxlength: [100, 'Project name cannot exceed 100 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  apiKey: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  settings: {
    trackingEnabled: {
      type: Boolean,
      default: true
    },
    errorThreshold: {
      type: Number,
      default: 5, // 5% error rate threshold
      min: 0,
      max: 100
    },
    responseTimeThreshold: {
      type: Number,
      default: 2000, // 2 seconds
      min: 0
    },
    alertEmail: {
      type: String,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    }
  },
  domains: [{
    type: String,
    trim: true
  }],
  tags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

// Generate API key before saving
projectSchema.pre('save', function(next) {
  if (this.isNew && !this.apiKey) {
    this.apiKey = generateApiKey();
  }
  next();
});

// Generate a unique API key
function generateApiKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = 'isk_'; // Insightify API key prefix
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Index for better query performance
projectSchema.index({ owner: 1 });
projectSchema.index({ apiKey: 1 });
projectSchema.index({ isActive: 1 });

module.exports = mongoose.model('Project', projectSchema);
