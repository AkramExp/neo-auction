import React, { useState } from 'react';
import { useAuction } from '../context/AuctionContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const TeamsList = () => {
  const { state } = useAuction();
  const { user } = useAuth();
  const { teams, players, auctionState } = state;
  const [selectedTeam, setSelectedTeam] = useState(null);

  const getTeamPlayers = (teamId) => {
    return players.filter(player => player.boughtBy === teamId);
  };

  const calculateTotalSpent = (teamPlayers) => {
    return teamPlayers.reduce((total, player) => total + (player.soldPrice || 0), 0);
  };

  const hasTeamPassed = (teamId) => {
    if (!auctionState?.passedTeams || !auctionState.currentPlayer) return false;
    return auctionState.passedTeams.some(
      passedTeam => {
        const passedTeamId = passedTeam._id || passedTeam;
        return passedTeamId === teamId;
      }
    );
  };

  const isMyTeam = (teamId) => {
    return user && user.team && (user.team._id === teamId);
  };

  // Sort teams: current user's team first, then others
  const sortedTeams = [...teams].sort((a, b) => {
    const aIsMyTeam = isMyTeam(a._id);
    const bIsMyTeam = isMyTeam(b._id);

    if (aIsMyTeam && !bIsMyTeam) return -1; // a comes first
    if (!aIsMyTeam && bIsMyTeam) return 1;  // b comes first
    return 0; // keep original order for others
  });

  const PlayerPopup = ({ team, onClose }) => {
    const teamPlayers = getTeamPlayers(team._id);

    const totalSpent = calculateTotalSpent(teamPlayers);
    const remainingBudget = team.budget - totalSpent;

    console.log(team)
    return (
      <div className="fixed inset-0 bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden transform transition-all">
          {/* Header */}
          <div className="bg-linear-to-r from-blue-600 to-purple-600 p-6 text-white">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold">{team.name}</h3>
                <p className="text-blue-100 text-sm mt-1">{team.owner.username}</p>
              </div>
              <button
                onClick={onClose}
                className="text-black text-2xl font-bold bg-white bg-opacity-20 rounded-full w-8 h-8 flex items-center justify-center transition-all hover:bg-opacity-30 cursor-pointer"
              >
                ×
              </button>
            </div>
          </div>

          {/* Budget Summary */}
          <div className="p-6 border-b border-gray-300">
            <div className="flex items-center justify-center gap-4 text-center">
              {/* <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-600 font-medium">Total Budget</p>
                <p className="text-lg font-bold text-gray-900">${team.budget.toLocaleString()}</p>
              </div> */}
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-600 font-medium">Remaining</p>
                <p className={`text-lg font-bold text-green-600`}>
                  ${team.budget.toLocaleString()}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-600 font-medium">Total Spent</p>
                <p className="text-lg font-bold text-red-600">${totalSpent.toLocaleString()}</p>
              </div>

            </div>
          </div>

          {/* Players List */}
          <div className="p-6 overflow-y-auto max-h-80">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-semibold text-gray-800">Acquired Players</h4>
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-1 rounded-full">
                {teamPlayers.length}/8
              </span>
            </div>

            {teamPlayers.length > 0 ? (
              <div className="space-y-3">
                {teamPlayers.map((player, index) => (
                  <div
                    key={player._id}
                    className="flex justify-between items-center p-4 bg-linear-to-r from-gray-50 to-white rounded-xl border border-gray-100 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-linear-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <span className="font-semibold text-gray-900 block">{player.name}</span>
                        <div className='mt-2 flex items-center gap-2'>
                          {player.position.split(",").map((position, index) => (
                            <span key={index} className="inline-flex text-xs px-2 py-1 rounded-full border bg-gray-100 text-gray-800 border-gray-200 font-medium capitalize">
                              {position || 'Player'}
                            </span>
                          ))}
                        </div>
                        {/* <span className="text-xs text-gray-500 capitalize">{player.position || 'Player'}</span> */}
                      </div>
                    </div>
                    <span className="bg-linear-to-r from-green-500 to-emerald-600 text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-sm">
                      ${player.soldPrice?.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">🏈</span>
                </div>
                <p className="text-gray-500 font-medium">No players acquired yet</p>
                <p className="text-gray-400 text-sm mt-1">Bids will appear here once players are bought</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Teams Overview</h3>
          <p className="text-gray-600 text-sm mt-1">Track team budgets and player acquisitions</p>
        </div>
        <div className="bg-blue-50 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
          {teams.length} Teams
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {sortedTeams.map(team => {
          const teamPlayers = getTeamPlayers(team._id);
          const totalSpent = calculateTotalSpent(teamPlayers);
          const remainingBudget = team.budget - totalSpent;
          const passedOnCurrent = hasTeamPassed(team._id);
          const isCurrentUserTeam = isMyTeam(team._id);
          const progressPercentage = Math.min((totalSpent / team.budget) * 100, 100);

          return (
            <div
              key={team._id}
              className={`relative border-2 rounded-2xl p-5 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl group ${isCurrentUserTeam
                ? 'border-blue-500 bg-linear-to-br from-blue-50 to-indigo-50 shadow-md'
                : passedOnCurrent
                  ? 'border-amber-400 bg-linear-to-br from-amber-50 to-orange-50'
                  : 'border-gray-200 bg-linear-to-br from-gray-50 to-white hover:border-gray-300'
                }`}
              onClick={() => setSelectedTeam(team)}
            >
              {/* Status Badges */}
              <div className="absolute -top-2 -right-2 flex gap-1">
                {isCurrentUserTeam && (
                  <span className="bg-linear-to-r from-blue-600 to-indigo-700 text-white text-xs px-2.5 py-1 rounded-full shadow-lg font-medium">
                    Your Team
                  </span>
                )}
                {passedOnCurrent && auctionState?.currentPlayer && (
                  <span className="bg-linear-to-r from-amber-500 to-orange-500 text-white text-xs px-2.5 py-1 rounded-full shadow-lg font-medium">
                    Passed
                  </span>
                )}
              </div>

              {/* Team Header */}
              <div className="flex items-center space-x-3 mb-4">
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-gray-900 text-lg truncate group-hover:text-blue-700 transition-colors">
                    {team.name}
                  </h4>
                  <p className="text-gray-500 text-sm">{teamPlayers.length}/8 Players</p>
                </div>
              </div>

              {/* Financial Details */}
              <div className="flex flex-col gap-3 text-sm">
                {/* <div className="text-center bg-white rounded-xl p-3 border border-gray-100">
                  <p className="text-gray-600 text-xs font-medium mb-1">Total Budget</p>
                  <p className="font-bold text-gray-900">${team.budget.toLocaleString()}</p>
                </div> */}
                <div className="text-center bg-white rounded-xl p-3 border border-gray-100 col-span-2">
                  <p className="text-gray-600 text-xs font-medium mb-1">Remaining Budget</p>
                  <p className={`font-bold text-lg text-green-600`}>
                    ${team.budget.toLocaleString()}
                  </p>
                </div>
                <div className="text-center bg-white rounded-xl p-3 border border-gray-100">
                  <p className="text-gray-600 text-xs font-medium mb-1">Amount Spent</p>
                  <p className="font-bold text-red-600">${totalSpent.toLocaleString()}</p>
                </div>

              </div>

              {/* Click Hint */}
              <div className="text-center mt-4">
                <span className="text-blue-600 text-xs font-medium bg-blue-50 px-2 py-1 rounded-full">
                  Click to view players
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Player Popup */}
      {selectedTeam && (
        <PlayerPopup
          team={selectedTeam}
          onClose={() => setSelectedTeam(null)}
        />
      )}
    </div>
  );
};

export default TeamsList;