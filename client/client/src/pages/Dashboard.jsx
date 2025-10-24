import React, { useState, useEffect } from 'react';
import { useSocket } from '../contexts/SocketContext';
import ConnectionTest from '../components/ConnectionTest';
import { 
  Activity, 
  TrendingUp, 
  AlertTriangle, 
  Clock,
  Users,
  Zap,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { cn } from '../lib/utils';

const Dashboard = () => {
  const { realTimeMetrics, connected } = useSocket();
  const [stats, setStats] = useState({
    totalRequests: 0,
    avgResponseTime: 0,
    errorRate: 0,
    activeUsers: 0
  });

  useEffect(() => {
    // Calculate stats from real-time metrics
    const metrics = Object.values(realTimeMetrics);
    const totalRequests = metrics.length;
    const avgResponseTime = metrics.reduce((sum, m) => sum + (m.responseTime || 0), 0) / totalRequests || 0;
    const errorCount = metrics.filter(m => m.statusCode >= 400).length;
    const errorRate = totalRequests > 0 ? (errorCount / totalRequests) * 100 : 0;

    setStats({
      totalRequests,
      avgResponseTime: Math.round(avgResponseTime),
      errorRate: Math.round(errorRate * 100) / 100,
      activeUsers: new Set(metrics.map(m => m.userId).filter(Boolean)).size
    });
  }, [realTimeMetrics]);

  const statCards = [
    {
      title: 'Total Requests',
      value: stats.totalRequests.toLocaleString(),
      icon: Activity,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      change: '+12%',
      changeType: 'positive'
    },
    {
      title: 'Avg Response Time',
      value: `${stats.avgResponseTime}ms`,
      icon: Clock,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      change: '-5%',
      changeType: 'positive'
    },
    {
      title: 'Error Rate',
      value: `${stats.errorRate}%`,
      icon: AlertTriangle,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
      change: '+2%',
      changeType: 'negative'
    },
    {
      title: 'Active Users',
      value: stats.activeUsers.toLocaleString(),
      icon: Users,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      change: '+8%',
      changeType: 'positive'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time analytics overview
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className={cn(
            'w-2 h-2 rounded-full',
            connected ? 'bg-green-500' : 'bg-red-500'
          )} />
          <span className="text-sm text-muted-foreground">
            {connected ? 'Live' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {stat.value}
                  </p>
                </div>
                <div className={cn('p-3 rounded-lg', stat.bgColor)}>
                  <Icon className={cn('w-6 h-6', stat.color)} />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                {stat.changeType === 'positive' ? (
                  <ArrowUp className="w-4 h-4 text-green-500" />
                ) : (
                  <ArrowDown className="w-4 h-4 text-red-500" />
                )}
                <span className={cn(
                  'ml-1 text-sm font-medium',
                  stat.changeType === 'positive' ? 'text-green-500' : 'text-red-500'
                )}>
                  {stat.change}
                </span>
                <span className="ml-1 text-sm text-muted-foreground">
                  from last hour
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Real-time Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Live Activity Feed */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Zap className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Live Activity</h3>
          </div>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {Object.entries(realTimeMetrics).length > 0 ? (
              Object.entries(realTimeMetrics).slice(-5).map(([route, metric]) => (
                <div key={route} className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                  <div className={cn(
                    'w-2 h-2 rounded-full',
                    metric.statusCode < 400 ? 'bg-green-500' : 'bg-red-500'
                  )} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {metric.route?.method} {metric.route?.path}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {metric.responseTime}ms • {new Date(metric.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                  <span className={cn(
                    'text-xs font-medium px-2 py-1 rounded',
                    metric.statusCode < 400 
                      ? 'bg-green-500/10 text-green-500' 
                      : 'bg-red-500/10 text-red-500'
                  )}>
                    {metric.statusCode}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No live activity yet</p>
                <p className="text-sm">Start tracking your API to see real-time metrics</p>
              </div>
            )}
          </div>
        </div>

        {/* Connection Test */}
        <ConnectionTest />
      </div>
    </div>
  );
};

export default Dashboard;
