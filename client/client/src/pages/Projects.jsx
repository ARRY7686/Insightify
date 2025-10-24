import React, { useState, useEffect } from 'react';
import { Plus, Copy, Eye, Trash2, Settings, Key } from 'lucide-react';
import { cn } from '../lib/utils';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    domains: []
  });

  useEffect(() => {
    // Simulate loading projects
    setTimeout(() => {
      setProjects([
        {
          id: '1',
          name: 'E-commerce API',
          description: 'Main e-commerce platform API',
          apiKey: 'isk_abc123def456ghi789jkl012mno345pqr678',
          domains: ['api.shop.com', 'api.store.com'],
          isActive: true,
          createdAt: '2024-01-15',
          stats: {
            totalRequests: 12543,
            avgResponseTime: 245,
            errorRate: 2.1
          }
        },
        {
          id: '2',
          name: 'User Management',
          description: 'User authentication and profile management',
          apiKey: 'isk_xyz789uvw456rst123qpo890nml567ijk234',
          domains: ['api.users.com'],
          isActive: true,
          createdAt: '2024-01-20',
          stats: {
            totalRequests: 8932,
            avgResponseTime: 156,
            errorRate: 0.8
          }
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const handleCreateProject = () => {
    const project = {
      id: Date.now().toString(),
      name: newProject.name,
      description: newProject.description,
      apiKey: `isk_${Math.random().toString(36).substr(2, 32)}`,
      domains: newProject.domains,
      isActive: true,
      createdAt: new Date().toISOString().split('T')[0],
      stats: {
        totalRequests: 0,
        avgResponseTime: 0,
        errorRate: 0
      }
    };
    
    setProjects([...projects, project]);
    setNewProject({ name: '', description: '', domains: [] });
    setShowCreateModal(false);
  };

  const copyApiKey = (apiKey) => {
    navigator.clipboard.writeText(apiKey);
    // You could add a toast notification here
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Projects</h1>
          <p className="text-muted-foreground">
            Manage your API projects and tracking
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </button>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <div key={project.id} className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  {project.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {project.description}
                </p>
              </div>
              <div className={cn(
                'w-2 h-2 rounded-full',
                project.isActive ? 'bg-green-500' : 'bg-gray-500'
              )} />
            </div>

            {/* API Key */}
            <div className="mb-4">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                API Key
              </label>
              <div className="flex items-center space-x-2 mt-1">
                <code className="flex-1 text-xs bg-muted px-2 py-1 rounded font-mono">
                  {project.apiKey.substring(0, 20)}...
                </code>
                <button
                  onClick={() => copyApiKey(project.apiKey)}
                  className="p-1 hover:bg-muted rounded"
                  title="Copy API Key"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <p className="text-lg font-semibold text-foreground">
                  {project.stats.totalRequests.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">Requests</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-foreground">
                  {project.stats.avgResponseTime}ms
                </p>
                <p className="text-xs text-muted-foreground">Avg Time</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-foreground">
                  {project.stats.errorRate}%
                </p>
                <p className="text-xs text-muted-foreground">Error Rate</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2">
              <button className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 text-sm border border-border rounded hover:bg-muted transition-colors">
                <Eye className="w-4 h-4" />
                <span>View</span>
              </button>
              <button className="flex items-center justify-center p-2 text-muted-foreground hover:text-foreground transition-colors">
                <Settings className="w-4 h-4" />
              </button>
              <button className="flex items-center justify-center p-2 text-muted-foreground hover:text-destructive transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Create New Project
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Project Name
                </label>
                <input
                  type="text"
                  value={newProject.name}
                  onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Enter project name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Description
                </label>
                <textarea
                  value={newProject.description}
                  onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Enter project description"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex items-center space-x-3 mt-6">
              <button
                onClick={handleCreateProject}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                Create Project
              </button>
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 border border-border rounded-md hover:bg-muted transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;
