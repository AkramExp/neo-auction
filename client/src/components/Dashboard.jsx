import React from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useAuction } from '../context/AuctionContext.jsx';
import AuctionBlock from './AuctionBlock.jsx';
import BiddingInterface from './BiddingInterface.jsx';
import AdminControls from './AdminControls.jsx';
import TeamsList from './TeamsList.jsx';
import PlayersList from './PlayersList.jsx';
import DebugDashboard from './DebugDashboard.jsx';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { state } = useAuction();

  if (state.loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl text-gray-600 mb-4">Loading auction data...</div>
          <div className="text-sm text-gray-500">
            <p>If this takes too long, check the browser console for errors.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="sm:text-2xl font-bold bg-linear-to-r from-orange-800 to-blue-800 bg-clip-text text-transparent">Neo League Auction</h1>
              <p className="hidden sm:block text-sm text-gray-600">
                Welcome, {user.username}
                {user.team && ` - ${user.team.name}`}
              </p>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                {user.role === 'spectator' ? (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                    Spectator Mode
                  </span>
                ) : user.role === 'owner' ? (
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs flex flex-wrap">
                    Team Owner
                  </span>
                ) : (
                  <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">
                    Administrator
                  </span>
                )}
              </div>

              <button
                onClick={logout}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors cursor-pointer"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Debug Information (optional) */}
        {/* <DebugDashboard /> */}

        <div className="space-y-6">
          {/* Auction Block */}
          <AuctionBlock />

          {/* Admin Controls (only for admin users) */}
          {user.role === 'admin' && <AdminControls />}

          {/* Bidding Interface (only for team owners) */}
          {user.role === 'owner' && <BiddingInterface />}

          {/* Spectator Message */}
          {user.role === 'spectator' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <p className="text-blue-700 font-semibold">Spectator Mode - You are watching the auction in read-only mode.</p>
              </div>
            </div>
          )}

          {/* Teams and Players */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TeamsList />
            <PlayersList />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;