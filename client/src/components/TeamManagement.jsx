import React, { useState } from 'react';
import { useAuction } from '../context/AuctionContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';

const TeamManagement = () => {
    const { state } = useAuction();
    const { user } = useAuth();
    const socket = useSocket();

    const { teams, players } = state;
    const [showForm, setShowForm] = useState(false);
    const [editingTeam, setEditingTeam] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        budget: '3000000'
    });

    if (user?.role !== 'admin') {
        return null;
    }

    const handleAddTeam = () => {
        setEditingTeam(null);
        setFormData({ name: '', budget: '3000000' });
        setShowForm(true);
    };

    const handleEditTeam = (team) => {
        setEditingTeam(team);
        setFormData({
            name: team.name,
            budget: team.budget.toString()
        });
        setShowForm(true);
    };

    const handleDeleteTeam = (teamId, teamName) => {
        if (window.confirm(`Are you sure you want to delete ${teamName}? This will also remove the team owner and cannot be undone.`)) {
            socket.emit('admin:deleteTeam', { teamId });
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!formData.name || !formData.budget) {
            alert('Please fill in all fields');
            return;
        }

        const teamData = {
            name: formData.name,
            budget: parseInt(formData.budget)
        };

        if (editingTeam) {
            socket.emit('admin:updateTeam', {
                teamId: editingTeam._id,
                ...teamData
            });
        } else {
            socket.emit('admin:createTeam', teamData);
        }

        setShowForm(false);
        setFormData({ name: '', budget: '3000000' });
        setEditingTeam(null);
    };

    const handleCancel = () => {
        setShowForm(false);
        setFormData({ name: '', budget: '3000000' });
        setEditingTeam(null);
    };

    const getTeamPlayers = (teamId) => {
        return players.filter(player => player.boughtBy === teamId);
    };

    const calculateTotalSpent = (teamPlayers) => {
        return teamPlayers.reduce((total, player) => total + (player.soldPrice || 0), 0);
    };

    return (
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-2xl font-bold text-gray-900">Team Management</h3>
                    <p className="text-gray-600 text-sm mt-1">Manage all teams in the auction</p>
                </div>
                <button
                    onClick={handleAddTeam}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer"
                >
                    Add New Team
                </button>
            </div>

            {/* Add/Edit Team Form */}
            {showForm && (
                <div className="mb-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
                    <div className="flex items-center space-x-3 mb-4">

                        <div>
                            <h4 className="font-bold text-gray-900 text-lg">
                                {editingTeam ? 'Edit Team' : 'Add New Team'}
                            </h4>

                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Team Name
                                </label>
                                <input
                                    type="text"
                                    placeholder="Enter team name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Budget ($)
                                </label>
                                <input
                                    type="number"
                                    placeholder="Enter budget amount"
                                    value={formData.budget}
                                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                                    className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                    min="0"
                                    required
                                />
                            </div>
                        </div>
                        <div className="flex space-x-3">
                            <button
                                type="submit"
                                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer"
                            >
                                {editingTeam ? 'Update Team' : 'Add Team'}
                            </button>
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Teams Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {teams.map(team => {
                    const teamPlayers = getTeamPlayers(team._id);
                    const totalSpent = calculateTotalSpent(teamPlayers);
                    const remainingBudget = team.budget - totalSpent;
                    const progressPercentage = Math.min((totalSpent / team.budget) * 100, 100);

                    return (
                        <div key={team._id} className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-5 border border-gray-200 hover:shadow-lg transition-all duration-300">
                            {/* Team Header */}
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center space-x-3">
                                    {/* <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-700 rounded-xl flex items-center justify-center shadow-md">
                                        <span className="text-white font-bold text-lg">
                                            {team.name.charAt(0).toUpperCase()}
                                        </span>
                                    </div> */}
                                    <div>
                                        <h4 className="font-bold text-gray-900 text-lg">{team.name}</h4>
                                        <p className="text-gray-600 text-sm">
                                            {team.owner?.username || 'No owner assigned'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex space-x-1">
                                    <button
                                        onClick={() => handleEditTeam(team)}
                                        className="bg-gradient-to-r from-yellow-500 to-amber-600 text-white p-2 rounded-lg text-sm font-semibold hover:shadow-lg transition-all duration-300 hover:scale-110 cursor-pointer"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDeleteTeam(team._id, team.name)}
                                        className="bg-gradient-to-r from-red-500 to-pink-600 text-white p-2 rounded-lg text-sm font-semibold hover:shadow-lg transition-all duration-300 hover:scale-110 cursor-pointer"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>

                            {/* Financial Details */}
                            <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                                <div className="text-center bg-white rounded-lg p-2 border border-gray-200">
                                    <p className="text-gray-600 text-xs font-medium mb-1">Remaining Budget</p>
                                    <p className={`font-bold text-lg text-green-600`}>
                                        ${team.budget.toLocaleString()}
                                    </p>
                                </div>
                                <div className="text-center bg-white rounded-lg p-2 border border-gray-200">
                                    <p className="text-gray-600 text-xs font-medium mb-1">Amount Spent</p>
                                    <p className="font-bold text-red-600">${totalSpent.toLocaleString()}</p>
                                </div>
                            </div>

                            {/* Players Section */}
                            {/* <div className="border-t border-gray-200 pt-3">
                                <div className="flex justify-between items-center mb-2">
                                    <h5 className="font-semibold text-gray-700 text-sm">Acquired Players</h5>
                                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">
                                        {teamPlayers.length}/8
                                    </span>
                                </div>

                                {teamPlayers.length > 0 ? (
                                    <div className="space-y-2 max-h-32 overflow-y-auto">
                                        {teamPlayers.map(player => (
                                            <div key={player._id} className="flex justify-between items-center bg-white rounded-lg p-2 border border-gray-200">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-gray-900 text-sm font-medium truncate">{player.name}</p>
                                                    <p className="text-gray-500 text-xs">{player.position}</p>
                                                </div>
                                                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded font-semibold whitespace-nowrap">
                                                    ${player.soldPrice?.toLocaleString()}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-3 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                                        <p className="text-gray-500 text-sm">No players acquired yet</p>
                                    </div>
                                )}
                            </div> */}
                        </div>
                    );
                })}
            </div>

            {/* Empty State */}
            {teams.length === 0 && (
                <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
                    <p className="text-gray-500 font-medium text-lg">No teams created yet</p>
                    <p className="text-gray-400 text-sm mt-1">Add your first team to get started</p>
                </div>
            )}
        </div>
    );
};

export default TeamManagement;