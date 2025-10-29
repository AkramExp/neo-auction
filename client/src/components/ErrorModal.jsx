import React from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useAuction } from '../context/AuctionContext.jsx';
import AuctionBlock from './AuctionBlock.jsx';
import BiddingInterface from './BiddingInterface.jsx';
import AdminControls from './AdminControls.jsx';
import TeamsList from './TeamsList.jsx';
import PlayersList from './PlayersList.jsx';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { state } = useAuction();

  if (state.loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading auction data...</div>
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
              <h1 className="md:text-2xl font-bold bg-linear-to-r from-orange-800 to-blue-800 bg-clip-text text-transparent">Neo League Auction</h1>
              <p className="text-sm text-gray-600">
                Welcome, {user.username}
                {user.team && ` - ${user.team.name}`}
              </p>
            </div>

            <button
              onClick={logout}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 cursor-pointer"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6">
          {/* Auction Block */}
          <AuctionBlock />

          {/* Admin Controls (only for admin users) */}
          <AdminControls />

          {/* Bidding Interface (only for team owners) */}
          {user.role === 'owner' && <BiddingInterface />}

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