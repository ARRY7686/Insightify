import React, { useState } from 'react';
import { testConnection } from '../utils/api';
import { Wifi, WifiOff, CheckCircle, XCircle } from 'lucide-react';

const ConnectionTest = () => {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState(null);

  const handleTest = async () => {
    setTesting(true);
    const response = await testConnection();
    setResult(response);
    setTesting(false);
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">
        Backend Connection Test
      </h3>
      
      <div className="space-y-4">
        <button
          onClick={handleTest}
          disabled={testing}
          className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {testing ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            <Wifi className="w-4 h-4" />
          )}
          <span>{testing ? 'Testing...' : 'Test Connection'}</span>
        </button>

        {result && (
          <div className={`p-4 rounded-lg flex items-center space-x-3 ${
            result.success 
              ? 'bg-green-500/10 border border-green-500/20' 
              : 'bg-red-500/10 border border-red-500/20'
          }`}>
            {result.success ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <XCircle className="w-5 h-5 text-red-500" />
            )}
            <div>
              <p className={`font-medium ${
                result.success ? 'text-green-500' : 'text-red-500'
              }`}>
                {result.success ? 'Connected Successfully!' : 'Connection Failed'}
              </p>
              {result.success ? (
                <p className="text-sm text-muted-foreground">
                  Backend server is running on port 5000
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Error: {result.error}
                </p>
              )}
            </div>
          </div>
        )}

        <div className="text-sm text-muted-foreground">
          <p><strong>Backend URL:</strong> http://localhost:5000</p>
          <p><strong>Frontend URL:</strong> http://localhost:5173</p>
          <p><strong>API Endpoint:</strong> http://localhost:5000/api</p>
        </div>
      </div>
    </div>
  );
};

export default ConnectionTest;
