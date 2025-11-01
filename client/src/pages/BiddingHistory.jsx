import axios from 'axios'
import React from 'react'
import { useEffect } from 'react';
import { useState } from 'react';

const BiddingHistory = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const response = await axios.get('https://neo-auction-1.onrender.com/api/bidding/bidding-history');
                console.log(response.data.biddingHistory)
                if (response.status === 200) {
                    setHistory(response.data.biddingHistory);
                }
            } catch (error) {
                console.error('Error fetching bidding history:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchHistory()
    }, [])

    const getStatusConfig = (status) => {
        const statusConfig = {
            sold: {
                color: 'bg-linear-to-r from-green-400 to-emerald-500 text-white',
                bgColor: 'bg-green-50',
                borderColor: 'border-green-200',
                textColor: 'text-green-800',
                icon: '✅',
                label: 'Sold'
            },
            unsold: {
                color: 'bg-linear-to-r from-red-400 to-pink-500 text-white',
                bgColor: 'bg-red-50',
                borderColor: 'border-red-200',
                textColor: 'text-red-800',
                icon: '⏹️',
                label: 'Unsold'
            },
            ongoing: {
                color: 'bg-linear-to-r from-blue-400 to-cyan-500 text-white',
                bgColor: 'bg-blue-50',
                borderColor: 'border-blue-200',
                textColor: 'text-blue-800',
                icon: '⏳',
                label: 'Ongoing'
            }
        };

        return statusConfig[status] || {
            color: 'bg-linear-to-r from-purple-400 to-purple-500 text-white',
            bgColor: 'bg-purple-50',
            borderColor: 'border-purple-200',
            textColor: 'text-purple-800',
            icon: '❓',
            label: status
        };
    }

    const getBiddingStatement = (bid) => {
        const teamName = bid.teamId?.name || 'Unknown Team';
        const playerName = bid.playerId?.name || 'Unknown Player';
        const amount = bid.amount;

        switch (bid.status) {
            case 'sold':
                return `${teamName} - ${playerName} (@${bid.playerId?.username}) - $${amount}`;
            case 'unsold':
                return `${playerName} (@${bid.playerId?.username}) - unsold`;
            case 'ongoing':
                return `${teamName} - $${amount} (@${bid.playerId?.username}) - ${playerName}`;
            default:
                return `${teamName} - ${playerName} (@${bid.playerId?.username}) - $${amount}`;
        }
    }

    const getStatusBadge = (status) => {
        const config = getStatusConfig(status);
        return (
            <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${config.bgColor} ${config.borderColor} ${config.textColor}`}>
                {config.icon} {config.label}
            </span>
        );
    }

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // Filter history based on search and status
    const filteredHistory = history.filter(bid => {
        const matchesSearch =
            bid.teamId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            bid.playerId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            bid.playerId?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            bid.amount?.toString().includes(searchQuery);

        const matchesStatus = filterStatus === 'all' || bid.status === filterStatus;

        return matchesSearch && matchesStatus;
    });

    // Calculate stats
    const stats = {
        total: history.length,
        sold: history.filter(bid => bid.status === 'sold').length,
        unsold: history.filter(bid => bid.status === 'unsold').length,
        ongoing: history.filter(bid => bid.status === 'ongoing').length,
        totalAmount: history.reduce((sum, bid) => sum + (bid.amount || 0), 0)
    }

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="flex justify-center items-center min-h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            {/* Header */}
            <div className="text-center mb-8">
                <h1 className="text-4xl font-bold bg-linear-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-3">
                    Bidding History
                </h1>
            </div>

            {/* Filters */}
            <div className="bg-linear-to-r from-indigo-50 to-purple-50 rounded-2xl shadow-lg p-4 border border-indigo-100 mb-6">
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div className="flex-1 w-full sm:max-w-md">
                        <input
                            type="text"
                            placeholder="🔍 Search by team, player, or amount..."
                            className="w-full px-4 py-2 border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all bg-white shadow-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        <select
                            className="px-4 py-2 border border-purple-200 rounded-xl bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all shadow-sm"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <option value="all">All Status</option>
                            <option value="sold">Sold</option>
                            <option value="unsold">Unsold</option>
                            <option value="ongoing">Ongoing</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Bidding History List */}
            <div className="bg-linear-to-br from-white to-blue-50 rounded-2xl shadow-lg border border-blue-100 overflow-hidden max-h-[70vh] overflow-y-auto">
                <div className="divide-y divide-blue-100">
                    {filteredHistory.length === 0 ? (
                        <div className="text-center py-16 bg-linear-to-br from-gray-50 to-blue-50">
                            <div className="w-20 h-20 bg-linear-to-r from-purple-200 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                                <span className="text-3xl">📝</span>
                            </div>
                            <p className="text-gray-600 font-semibold text-lg">No bidding history found</p>
                            <p className="text-gray-500 text-sm mt-2">
                                {searchQuery || filterStatus !== 'all'
                                    ? 'Try adjusting your search filters'
                                    : 'Bidding activities will appear here once they start'
                                }
                            </p>
                        </div>
                    ) : (
                        filteredHistory.map((bid, index) => {
                            const statusConfig = getStatusConfig(bid.status);
                            const cardColors = [
                                'hover:bg-linear-to-r hover:from-blue-50 hover:to-cyan-50',
                                'hover:bg-linear-to-r hover:from-purple-50 hover:to-pink-50',
                                'hover:bg-linear-to-r hover:from-green-50 hover:to-emerald-50',
                                'hover:bg-linear-to-r hover:from-orange-50 hover:to-red-50'
                            ];
                            const colorClass = cardColors[index % cardColors.length];

                            return (
                                <div
                                    key={bid._id}
                                    className={`px-6 py-4 ${colorClass} transition-all duration-300 group cursor-pointer border-l-4 ${statusConfig.borderColor}`}
                                    onClick={() => console.log('Bid details:', bid)}
                                >
                                    <div className="flex items-start space-x-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
                                                <p className="font-semibold text-zinc-900 group-hover:text-purple-700 transition-colors">
                                                    {getBiddingStatement(bid)}
                                                </p>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xs text-amber-600 font-medium bg-amber-50 px-2 py-1 rounded-full border border-amber-200">
                                                        {formatDate(bid.createdAt)}
                                                    </span>
                                                    {getStatusBadge(bid.status)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    )
}

export default BiddingHistory