import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { Bell, User, LogOut, Wifi, WifiOff } from 'lucide-react';
import { cn } from '../lib/utils';

const Header = () => {
  const { user, logout } = useAuth();
  const { connected } = useSocket();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left side */}
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-semibold text-foreground">
            Welcome back, {user?.name}!
          </h2>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          {/* Connection Status */}
          <div className="flex items-center space-x-2">
            {connected ? (
              <Wifi className="w-4 h-4 text-green-500" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-500" />
            )}
            <span className={cn(
              'text-sm font-medium',
              connected ? 'text-green-500' : 'text-red-500'
            )}>
              {connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>

          {/* Notifications */}
          <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
            <Bell className="w-5 h-5" />
          </button>

          {/* User Menu */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-primary-foreground" />
              </div>
              <div className="text-sm">
                <p className="font-medium text-foreground">{user?.name}</p>
                <p className="text-muted-foreground">{user?.email}</p>
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="p-2 text-muted-foreground hover:text-foreground transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
