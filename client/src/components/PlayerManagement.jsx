import React, { useState } from 'react';
import { useAuction } from '../context/AuctionContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';

const PlayerManagement = () => {
    const { state } = useAuction();
    const { user } = useAuth();
    const socket = useSocket();

    const { players } = state;
    const [showForm, setShowForm] = useState(false);
    const [editingPlayer, setEditingPlayer] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        position: '',
        basePrice: ''
    });

    if (user?.role !== 'admin') {
        return null;
    }

    const handleAddPlayer = () => {
        setEditingPlayer(null);
        setFormData({ name: '', position: '', basePrice: '' });
        setShowForm(true);
    };

    const handleEditPlayer = (player) => {
        setEditingPlayer(player);
        setFormData({
            name: player.name,
            position: player.position,
            basePrice: player.basePrice.toString()
        });
        setShowForm(true);
    };

    const handleDeletePlayer = (playerId, playerName) => {
        if (window.confirm(`Are you sure you want to delete ${playerName}? This action cannot be undone.`)) {
            socket.emit('admin:deletePlayer', { playerId });
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!formData.name || !formData.position || !formData.basePrice) {
            alert('Please fill in all fields');
            return;
        }

        const playerData = {
            name: formData.name,
            position: formData.position,
            basePrice: parseInt(formData.basePrice)
        };

        if (editingPlayer) {
            socket.emit('admin:updatePlayer', {
                playerId: editingPlayer._id,
                ...playerData
            });
        } else {
            socket.emit('admin:createPlayer', playerData);
        }

        setShowForm(false);
        setFormData({ name: '', position: '', basePrice: '' });
        setEditingPlayer(null);
    };

    const handleCancel = () => {
        setShowForm(false);
        setFormData({ name: '', position: '', basePrice: '' });
        setEditingPlayer(null);
    };

    const playerGroups = {
        upcoming: players.filter(p => p.status === 'upcoming'),
        sold: players.filter(p => p.status === 'sold'),
        unsold: players.filter(p => p.status === 'unsold')
    };

    const getStatusConfig = (status) => {
        switch (status) {
            case 'sold':
                return {
                    class: 'bg-gradient-to-r from-green-500 to-emerald-600 text-white',
                    icon: '✅'
                };
            case 'unsold':
                return {
                    class: 'bg-gradient-to-r from-red-500 to-pink-600 text-white',
                    icon: '⏹️'
                };
            case 'upcoming':
                return {
                    class: 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white',
                    icon: '⏳'
                };
            default:
                return {
                    class: 'bg-gradient-to-r from-gray-500 to-gray-600 text-white',
                    icon: '❓'
                };
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-2xl font-bold text-gray-900">Player Management</h3>
                    <p className="text-gray-600 text-sm mt-1">Manage all players in the auction</p>
                </div>
                <button
                    onClick={handleAddPlayer}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 hover:scale-105"
                >
                    Add New Player
                </button>
            </div>

            {/* Add/Edit Player Form */}
            {showForm && (
                <div className="mb-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
                    <div className="flex items-center space-x-3 mb-4">

                        <div>
                            <h4 className="font-bold text-gray-900 text-lg">
                                {editingPlayer ? 'Edit Player' : 'Add New Player'}
                            </h4>
                            <p className="text-gray-600 text-sm">
                                {editingPlayer ? 'Update player details' : 'Create a new player for auction'}
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Player Name
                                </label>
                                <input
                                    type="text"
                                    placeholder="Enter player name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Position
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g., QB, RB, WR"
                                    value={formData.position}
                                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                                    className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Base Price ($)
                                </label>
                                <input
                                    type="number"
                                    placeholder="Enter base price"
                                    value={formData.basePrice}
                                    onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                                    className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                    min="0"
                                    required
                                />
                            </div>
                        </div>
                        <div className="flex space-x-3">
                            <button
                                type="submit"
                                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 hover:scale-105"
                            >
                                {editingPlayer ? 'Update Player' : 'Add Player'}
                            </button>
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 hover:scale-105"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Players List */}
            <div className="space-y-8">
                {Object.entries(playerGroups).map(([status, statusPlayers]) => {
                    const statusConfig = getStatusConfig(status);

                    return (
                        <div key={status} className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border border-gray-200 max-h-[20rem] overflow-y-auto">
                            {/* Section Header */}
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center space-x-3">
                                    <div>
                                        <h4 className="font-bold text-xl text-gray-900 capitalize">
                                            {status} Players
                                        </h4>
                                        <p className="text-gray-600 text-sm">
                                            {statusPlayers.length} player{statusPlayers.length !== 1 ? 's' : ''}
                                        </p>
                                    </div>
                                </div>
                                <div className={`px-4 py-2 rounded-full text-sm font-semibold ${statusConfig.class}`}>
                                    {statusPlayers.length}
                                </div>
                            </div>

                            {statusPlayers.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {statusPlayers.map(player => {
                                        const canEditDelete = player.status !== 'sold';

                                        return (
                                            <div key={player._id} className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-lg transition-all duration-300">
                                                {/* Player Header */}
                                                <div className="flex justify-between items-start mb-3">
                                                    <div>
                                                        <h5 className="font-bold text-gray-900 text-lg">{player.name}</h5>
                                                    </div>
                                                    {/* <span className={`text-xs px-3 py-1.5 rounded-full font-bold ${statusConfig.class}`}>
                                                        {status}
                                                    </span> */}
                                                    <p className="text-gray-600 text-sm">{player.position}</p>
                                                </div>

                                                {/* Player Details */}
                                                <div className="space-y-2 mb-4">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-gray-600 text-sm">Base Price:</span>
                                                        <span className="font-semibold text-gray-900">${player.basePrice.toLocaleString()}</span>
                                                    </div>
                                                    {player.status === 'sold' && player.soldPrice && (
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-gray-600 text-sm">Sold For:</span>
                                                            <span className="font-semibold text-green-600">${player.soldPrice.toLocaleString()}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Action Buttons */}
                                                <div className="flex space-x-2">
                                                    <button
                                                        onClick={() => handleEditPlayer(player)}
                                                        disabled={!canEditDelete}
                                                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all duration-300 hover:scale-105 ${canEditDelete
                                                            ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-white hover:shadow-lg'
                                                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                            }`}
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeletePlayer(player._id, player.name)}
                                                        disabled={!canEditDelete}
                                                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all duration-300 hover:scale-105 ${canEditDelete
                                                            ? 'bg-gradient-to-r from-red-500 to-pink-600 text-white hover:shadow-lg'
                                                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                            }`}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">

                                    <p className="text-gray-500 font-medium">No {status} players</p>
                                    <p className="text-gray-400 text-sm mt-1">
                                        {status === 'upcoming' ? 'Add players to see them here' :
                                            status === 'sold' ? 'Sold players will appear here' :
                                                'Unsold players will appear here'}
                                    </p>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default PlayerManagement;