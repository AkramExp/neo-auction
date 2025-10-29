import React, { useState } from 'react';
import { useAuction } from '../context/AuctionContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';
import PlayerManagement from './PlayerManagement.jsx';
import TeamManagement from './TeamManagement.jsx';

const AdminControls = () => {
  const { state } = useAuction();
  const { user } = useAuth();
  const socket = useSocket();

  // Don't show admin controls for public users or non-admins
  if (!user || user.role !== 'admin') {
    return null;
  }

  const { players, auctionState } = state;
  const [activeTab, setActiveTab] = useState('auction');
  const [selectedPlayerId, setSelectedPlayerId] = useState('');

  const upcomingPlayers = players.filter(p => p.status === 'upcoming');
  const unsoldPlayers = players.filter(p => p.status === 'unsold');
  const hasActivePlayer = !!auctionState?.currentPlayer;
  const hasBids = auctionState?.highBidder !== null && auctionState?.highBidder !== undefined;

  const handleSendToBlock = (playerId = null) => {
    const playerToSend = playerId || selectedPlayerId;

    if (!playerToSend) {
      alert('Please select a player to send to the block');
      return;
    }
    socket.emit('admin:sendToBlock', { playerId: playerToSend });
    setSelectedPlayerId(''); // Reset selection after sending
  };

  const handleRandomPlayer = () => {
    if (upcomingPlayers.length === 0) {
      alert('No upcoming players available for random selection');
      return;
    }

    // Get random player from upcoming players
    const randomIndex = Math.floor(Math.random() * upcomingPlayers.length);
    const randomPlayer = upcomingPlayers[randomIndex];

    // Set the selected player in dropdown and send to block
    setSelectedPlayerId(randomPlayer._id);
    handleSendToBlock(randomPlayer._id);
  };

  const handleFinalizeBid = () => {
    socket.emit('admin:finalizeBid');
  };

  const handleMarkUnsold = () => {
    if (hasBids) {
      alert('Cannot mark as unsold when there are active bids on this player. Please finalize the bid instead.');
      return;
    }
    socket.emit('admin:markUnsold');
  };

  const handleRelistPlayer = (playerId, playerName) => {
    if (window.confirm(`Relist ${playerName} for auction?`)) {
      socket.emit('admin:relistPlayer', { playerId });
    }
  };

  const tabs = [
    { id: 'auction', name: 'Auction Controls' },
    { id: 'players', name: 'Player Management' },
    { id: 'teams', name: 'Team Management' }
  ];

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Admin Panel</h3>
          <p className="text-gray-600 text-sm mt-1">Manage auction and players</p>
        </div>
        <div className="bg-gradient-to-r from-red-500 to-pink-600 text-white px-4 py-2 rounded-full text-sm font-medium">
          Admin Mode
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap py-3 px-1 border-b-2 font-semibold text-sm cursor-pointer transition-colors ${activeTab === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'auction' && (
        <div className="space-y-6">
          {/* Send Player to Block */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
            <div className="flex items-center space-x-3 mb-4">

              <div>
                <h4 className="font-bold text-gray-900 text-lg">Send Player to Block</h4>
                <p className="text-gray-600 text-sm">{upcomingPlayers.length} players available</p>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-end">
              <div className="flex-1">
                <label htmlFor="player-select" className="block text-sm font-semibold text-gray-700 mb-2">
                  Select Player
                </label>
                <select
                  id="player-select"
                  value={selectedPlayerId}
                  onChange={(e) => setSelectedPlayerId(e.target.value)}
                  className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  disabled={hasActivePlayer || upcomingPlayers.length === 0}
                >
                  <option value="">Choose a player...</option>
                  {upcomingPlayers.map(player => (
                    <option key={player._id} value={player._id}>
                      {player.name} - {player.position} - ${player.basePrice.toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                <button
                  onClick={() => handleSendToBlock()}
                  disabled={hasActivePlayer || !selectedPlayerId || upcomingPlayers.length === 0}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105 cursor-pointer"
                >
                  Send Selected
                </button>
                <button
                  onClick={handleRandomPlayer}
                  disabled={hasActivePlayer || upcomingPlayers.length === 0}
                  className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105 cursor-pointer"
                >
                  🎲 Random
                </button>
              </div>
            </div>

            {upcomingPlayers.length === 0 && (
              <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
                <p className="text-yellow-700 font-medium">No upcoming players available.</p>
              </div>
            )}
          </div>

          {/* Auction Controls */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
            <div className="flex items-center space-x-3 mb-4">

              <div>
                <h4 className="font-bold text-gray-900 text-lg">Auction Controls</h4>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleFinalizeBid}
                disabled={!hasActivePlayer || !hasBids}
                className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105 cursor-pointer"
              >
                Finalize Bid
              </button>

              <button
                onClick={handleMarkUnsold}
                disabled={!hasActivePlayer || hasBids}
                className="bg-gradient-to-r from-yellow-500 to-amber-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105 cursor-pointer"
              >
                Mark Unsold
              </button>
            </div>


          </div>

          {/* Relist Unsold Players */}
          {/* {unsoldPlayers.length > 0 && (
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-200">
              <div className="flex items-center space-x-3 mb-4">
                <div>
                  <h4 className="font-bold text-gray-900 text-lg">Relist Unsold Players</h4>
                  <p className="text-gray-600 text-sm">{unsoldPlayers.length} players available for relisting</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {unsoldPlayers.map(player => (
                  <div key={player._id} className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h5 className="font-bold text-gray-900">{player.name}</h5>
                        <p className="text-gray-600 text-sm">{player.position}</p>
                      </div>
                      <span className="bg-red-100 text-red-800 text-xs px-3 py-1 rounded-full font-semibold">
                        Unsold
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700 font-semibold">${player.basePrice.toLocaleString()}</span>
                      <button
                        onClick={() => handleRelistPlayer(player._id, player.name)}
                        className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:shadow-lg transition-all duration-300 hover:scale-105"
                      >
                        Relist
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )} */}
        </div>
      )}

      {activeTab === 'players' && <PlayerManagement />}
      {activeTab === 'teams' && <TeamManagement />}
    </div>
  );
};

export default AdminControls;