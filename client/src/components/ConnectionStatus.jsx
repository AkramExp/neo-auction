import React from 'react';
import { useAuth } from '../context/AuthContext.jsx';

const ConnectionStatus = () => {
  const { socketConnected } = useAuth();

  return (
    <div className="fixed top-2 left-2 md:top-4 md:left-4 lg:top-4 lg:left-4 z-50">
      <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-white text-sm ${socketConnected ? 'bg-green-500' : 'bg-red-500'
        }`}>
        <div className={`w-2 h-2 rounded-full ${socketConnected ? 'bg-green-300' : 'bg-red-300'
          }`}></div>
        <span>{socketConnected ? 'Connected' : 'Disconnected'}</span>
      </div>
    </div>
  );
};

export default ConnectionStatus;