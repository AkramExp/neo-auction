import React, { useEffect, useState } from 'react';
import { useAuction } from '../context/AuctionContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';

const PlayersList = () => {
  const { state } = useAuction();
  const { user } = useAuth();
  const socket = useSocket();

  const { players, teams } = state;
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState(null);

  const [filterPosition, setFilterPosition] = useState("");





  const getStatusConfig = (status) => {
    switch (status) {
      case 'sold':
        return {
          class: 'bg-linear-to-r from-green-500 to-emerald-600 text-white',
          icon: '✅',
          label: 'Sold',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200'
        };
      case 'unsold':
        return {
          class: 'bg-linear-to-r from-red-500 to-pink-600 text-white',
          icon: '⏹️',
          label: 'Unsold',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200'
        };
      case 'upcoming':
        return {
          class: 'bg-linear-to-r from-blue-500 to-cyan-600 text-white',
          icon: '⏳',
          label: 'Upcoming',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200'
        };
      default:
        return {
          class: 'bg-linear-to-r from-gray-500 to-gray-600 text-white',
          icon: '❓',
          label: 'Unknown',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200'
        };
    }
  };

  const getBuyingTeam = (player) => {
    if (player.status !== 'sold') return null;
    return teams.find(team => team._id === player.boughtBy);
  };

  const handleRelistPlayer = (playerId, playerName) => {
    if (!user || user.role !== 'admin') return;
    socket.emit('admin:relistPlayer', { playerId });
  };

  const getRoleColor = (position) => {
    const role = position?.toLowerCase();
    if (role?.includes('batsman') || role?.includes('batter')) return 'bg-orange-100 text-orange-800 border-orange-200';
    if (role?.includes('bowler')) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (role?.includes('all-rounder')) return 'bg-purple-100 text-purple-800 border-purple-200';
    if (role?.includes('wicket')) return 'bg-green-100 text-green-800 border-green-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // Sort sold players by highest price first
  const playerGroups = {
    upcoming: players.filter(p => p.status === 'upcoming'),
    sold: players
      .filter(p => p.status === 'sold')
      .sort((a, b) => (b.soldPrice || 0) - (a.soldPrice || 0)), // Highest to lowest
    unsold: players.filter(p => p.status === 'unsold')
  };

  // CSV Export Function
  const exportToCSV = (players, status) => {
    if (players.length === 0) {
      alert('No players to export');
      return;
    }

    let csvContent = '';
    const headers = ['Name', 'Position', 'Base Price', 'Sold Price', 'Team'];
    csvContent += headers.join(',') + '\n';

    players.forEach(player => {
      const buyingTeam = getBuyingTeam(player);
      const row = [
        `"${player.name}"`,
        `"${player.position || 'Player'}"`,
        player.basePrice || 0,
        player.soldPrice || 0,
        `"${buyingTeam?.name || 'Unknown Team'}"`
      ];
      csvContent += row.join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${status}_players_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const PlayersTablePopup = ({ status, players, onClose }) => {
    const statusConfig = getStatusConfig(status);
    const [filteredPlayers, setFilteredPlayers] = useState(players || []);

    useEffect(() => {
      const newPlayers = players.filter(player => (player.name.toLowerCase().includes(searchQuery.toLowerCase()) || player.username.toLowerCase().includes(searchQuery.toLowerCase())));

      let filterPlayers = newPlayers;

      if (filterPosition !== "")
        filterPlayers = newPlayers.filter(player => player.position.toLowerCase().includes(filterPosition.toLowerCase()));

      if (filterPosition === 'br') {
        filterPlayers = newPlayers.filter(
          player => player.position.toLowerCase().includes("libero") || player.position.toLowerCase().includes("ts")
        );
      }

      setFilteredPlayers(filterPlayers);
    }, [searchQuery, filterPosition])

    const TableHeader = () => (
      <thead className="bg-gray-50">
        <tr>
          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[120px]">
            Player
          </th>
          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[100px]">
            Position
          </th>
          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[100px]">
            Base Price
          </th>
          {status === 'sold' && (
            <>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[100px]">
                Sold Price
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[120px]">
                Team
              </th>
            </>
          )}
          {status === 'unsold' && user?.role === 'admin' && (
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[100px]">
              Actions
            </th>
          )}
        </tr>
      </thead>
    );

    const TableRow = ({ player, index }) => {
      const buyingTeam = getBuyingTeam(player);
      const roleColor = getRoleColor(player.position);

      return (
        <tr className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
          {/* Player Name */}
          <td className="px-4 py-3 whitespace-nowrap min-w-[120px]">
            <div className="text-sm font-semibold text-gray-900">{player.name} <span className='text-gray-700 font-normal'>( @{player.username} )</span></div>
          </td>

          {/* Position */}
          <td className="px-4 py-3 whitespace-nowrap min-w-[100px]">
            <div className='flex items-center gap-2'>
              {player.position.split(",").map((position, index) => (<span key={index} className={`inline-flex text-xs px-2 py-1 rounded-full border ${roleColor} font-medium capitalize`}>
                {position || 'Player'}
              </span>))}
            </div>
          </td>

          {/* Base Price */}
          <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900 min-w-[100px]">
            ${player.basePrice?.toLocaleString()}
          </td>

          {/* Sold-specific columns */}
          {status === 'sold' && (
            <>
              <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-green-600 min-w-[100px]">
                ${player.soldPrice?.toLocaleString()}
              </td>
              <td className="px-4 py-3 whitespace-nowrap min-w-[120px]">
                <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                  {buyingTeam?.name || 'Unknown Team'}
                </span>
              </td>
            </>
          )}

          {/* Admin Actions for Unsold */}
          {status === 'unsold' && user?.role === 'admin' && (
            <td className="px-4 py-3 whitespace-nowrap min-w-[100px]">
              <button
                onClick={() => handleRelistPlayer(player._id, player.name)}
                className="bg-linear-to-r from-purple-500 to-pink-600 text-white py-2 px-4 rounded-lg text-xs font-semibold hover:shadow-lg transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                Relist
              </button>
            </td>
          )}
        </tr>
      );
    };

    return (
      <div className="fixed inset-0 bg-opacity-60 flex items-center justify-center z-50 p-2 sm:p-4 backdrop-blur-sm">
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-full sm:max-w-6xl h-[90vh] overflow-hidden mx-2">
          {/* Header */}
          <div className={`p-4 sm:p-6 text-white ${statusConfig.class}`}>
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="hidden sm:block text-xl sm:text-2xl">{statusConfig.icon}</div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold">{statusConfig.label} Players</h3>
                  <p className="text-white text-opacity-90 text-xs sm:text-sm">
                    {players.length} player{players.length !== 1 ? 's' : ''}
                    {status === 'sold' && ' • Sorted by highest price'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2 sm:space-x-3">
                {/* CSV Export Button - Show for all statuses */}
                <button
                  onClick={() => exportToCSV(players, status)}
                  className="bg-white text-green-700 py-1 px-2 sm:py-2 sm:px-4 rounded text-xs sm:text-sm font-semibold hover:bg-green-50 transition-all flex items-center space-x-1 sm:space-x-2 cursor-pointer"
                >
                  <span>📊</span>
                  <span className="hidden sm:inline">Export</span>
                </button>
                <button
                  onClick={onClose}
                  className="text-black cursor-pointer text-xl sm:text-2xl font-bold bg-white bg-opacity-20 rounded-full w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center transition-all hover:bg-opacity-30"
                >
                  ×
                </button>
              </div>
            </div>
          </div>

          <div className='flex flex-col sm:flex-row items-center justify-center gap-4 pt-3'>
            <input type="text" placeholder='Search by Username' className='border-gray-300 rounded-md border text-sm px-4 py-2' onChange={e => setSearchQuery(e.target.value)} value={searchQuery} autoFocus />
            <select className='bg-linear-to-r text-gray-700 border border-gray-300 rounded-md font-semibold px-4 py-1 cursor-pointer' onChange={e => { setFilterPosition(e.target.value) }} value={filterPosition}>
              <option value="">All</option>
              <option value="setter">Setter</option>
              <option value="rw">Right Wing</option>
              <option value="lw">Left Wing</option>
              <option value="ts">Third Spiker</option>
              <option value="libero">Libero</option>
              <option value="br">Backrow</option>
            </select>
          </div>
          {/* Table Container with Horizontal Scroll */}
          <div className="p-2 sm:p-6 overflow-auto h-[calc(90vh-170px)] sm:h-[calc(90vh-200px)] flex-1">
            {filteredPlayers.length > 0 ? (
              <div className="border border-gray-200 rounded-lg sm:rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <TableHeader />
                    <tbody className="divide-y divide-gray-200">
                      {filteredPlayers.map((player, index) => (
                        <TableRow key={player._id} player={player} index={index} />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 sm:py-12 bg-gray-50 rounded-lg sm:rounded-xl border-2 border-dashed border-gray-300">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <span className="text-xl sm:text-2xl">👤</span>
                </div>
                <p className="text-gray-500 font-medium text-base sm:text-lg">No {status} players</p>
                <p className="text-gray-400 text-xs sm:text-sm mt-1">
                  {status === 'upcoming' ? 'Players will appear here when added to auction' :
                    status === 'sold' ? 'Sold players will appear here' :
                      'Unsold players will appear here'}
                </p>
              </div>
            )}
          </div>

          {/* Footer Stats */}
          <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex justify-between items-center text-xs sm:text-sm text-gray-600">
              <span>Showing {filteredPlayers.length} player{filteredPlayers.length !== 1 ? 's' : ''}</span>
              {status === 'sold' && (
                <span className="font-semibold">
                  Total: ${players.reduce((sum, player) => sum + (player.soldPrice || 0), 0).toLocaleString()}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl p-4 sm:p-6 border border-gray-100">
      <div className="flex justify-between items-center mb-6 sm:mb-8">
        <div>
          <h3 className="text-base sm:text-2xl font-bold text-gray-900">Players Auction</h3>
          <p className="hidden sm:block text-gray-600 text-sm mt-1">Click on any status to view players in table format</p>
        </div>
        <div className="bg-linear-to-r from-blue-500 to-purple-600 text-white px-3 py-1 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium">
          {players.length} Players
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {Object.entries(playerGroups).map(([status, statusPlayers]) => {
          const statusConfig = getStatusConfig(status);

          return (
            <div
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`group cursor-pointer border-2 rounded-xl sm:rounded-2xl p-4 sm:p-6 transition-all duration-300 hover:shadow-lg sm:hover:shadow-xl hover:scale-105 ${statusConfig.bgColor} ${statusConfig.borderColor}`}
            >
              <div className="text-center">
                <div className={`hidden w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl ${statusConfig.class} sm:flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                  <span className="text-xl sm:text-2xl">{statusConfig.icon}</span>
                </div>

                <h4 className="font-bold text-lg sm:text-xl text-gray-900 mb-1 sm:mb-2 capitalize">
                  {statusConfig.label}
                </h4>
                <p className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1 sm:mb-2">
                  {statusPlayers.length}
                </p>
                <p className="text-gray-600 text-xs sm:text-sm">
                  player{statusPlayers.length !== 1 ? 's' : ''}
                </p>

                <div className="mt-3 sm:mt-4">
                  <span className="text-blue-600 text-xs font-medium bg-white px-2 py-1 sm:px-3 sm:py-1.5 rounded-full shadow-sm">
                    View List
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 text-center">
        <div className="bg-blue-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-blue-100">
          <p className="text-xl sm:text-2xl font-bold text-blue-700">{playerGroups.upcoming.length}</p>
          <p className="text-xs sm:text-sm text-blue-600 font-medium">Upcoming</p>
        </div>
        <div className="bg-green-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-green-100">
          <p className="text-xl sm:text-2xl font-bold text-green-700">{playerGroups.sold.length}</p>
          <p className="text-xs sm:text-sm text-green-600 font-medium">Sold</p>
        </div>
        <div className="bg-red-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-red-100">
          <p className="text-xl sm:text-2xl font-bold text-red-700">{playerGroups.unsold.length}</p>
          <p className="text-xs sm:text-sm text-red-600 font-medium">Unsold</p>
        </div>
        <div className="bg-purple-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-purple-100">
          <p className="text-xl sm:text-2xl font-bold text-purple-700">{players.length}</p>
          <p className="text-xs sm:text-sm text-purple-600 font-medium">Total</p>
        </div>
      </div>

      {/* Players Table Popup */}
      {selectedStatus && (
        <PlayersTablePopup
          status={selectedStatus}
          players={playerGroups[selectedStatus]}
          onClose={() => setSelectedStatus(null)}
        />
      )}


    </div>
  );
};

export default PlayersList;