import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API endpoints
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (name, email, password) => api.post('/auth/register', { name, email, password }),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
};

export const projectsAPI = {
  getProjects: () => api.get('/projects'),
  getProject: (id) => api.get(`/projects/${id}`),
  createProject: (data) => api.post('/projects', data),
  updateProject: (id, data) => api.put(`/projects/${id}`, data),
  deleteProject: (id) => api.delete(`/projects/${id}`),
  getProjectStats: (id) => api.get(`/projects/${id}/stats`),
  regenerateApiKey: (id) => api.post(`/projects/${id}/regenerate-key`),
};

export const analyticsAPI = {
  track: (data) => api.post('/analytics/track', data),
  getRealtimeMetrics: (projectId, range = '1') => api.get(`/analytics/realtime/${projectId}?range=${range}`),
  getRoutePerformance: (projectId, range = '24') => api.get(`/analytics/routes/${projectId}?range=${range}`),
  getErrorAnalysis: (projectId, range = '24') => api.get(`/analytics/errors/${projectId}?range=${range}`),
  getHistoricalTrends: (projectId, period = '7d', metric = 'requests') => 
    api.get(`/analytics/trends/${projectId}?period=${period}&metric=${metric}`),
};

// Test connection function
export const testConnection = async () => {
  try {
    const response = await axios.get('http://localhost:5000/');
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export default api;
