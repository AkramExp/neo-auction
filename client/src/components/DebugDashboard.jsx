import React from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useAuction } from '../context/AuctionContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';

const DebugDashboard = () => {
  const { user, socketConnected } = useAuth();
  const { state } = useAuction();
  const socket = useSocket();

  const requestState = () => {
    console.log('Manually requesting state...');
    socket.emit('auction:getState');
  };

  return (
    <div className="bg-yellow-100 border border-yellow-400 rounded-lg p-4 mb-4">
      <h3 className="text-lg font-bold text-yellow-800 mb-2">Debug Information</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div>
          <p><strong>User:</strong> {user?.username} ({user?.role})</p>
          <p><strong>Socket:</strong> {socketConnected ? '✅ Connected' : '❌ Disconnected'}</p>
          <p><strong>Socket ID:</strong> {socket?.id || 'None'}</p>
        </div>
        
        <div>
          <p><strong>Loading:</strong> {state.loading ? '✅ Yes' : '❌ No'}</p>
          <p><strong>Error:</strong> {state.error || 'None'}</p>
          <p><strong>Teams:</strong> {state.teams.length}</p>
          <p><strong>Players:</strong> {state.players.length}</p>
        </div>
        
        <div>
          <p><strong>Auction State:</strong> {state.auctionState ? '✅ Present' : '❌ Null'}</p>
          <button 
            onClick={requestState}
            className="bg-blue-500 text-white px-3 py-1 rounded text-xs mt-2"
          >
            Request State
          </button>
        </div>
      </div>

      {state.error && (
        <div className="mt-2 p-2 bg-red-100 border border-red-400 rounded">
          <strong>Error:</strong> {state.error}
        </div>
      )}
    </div>
  );
};

export default DebugDashboard;