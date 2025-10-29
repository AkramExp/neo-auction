import React from 'react';
import { useAuction } from '../context/AuctionContext.jsx';
import Login from './Login.jsx';
import AuctionBlock from './AuctionBlock.jsx';
import TeamsList from './TeamsList.jsx';
import PlayersList from './PlayersList.jsx';

const HomePage = () => {
    const { state } = useAuction();
    const { auctionState, loading, error } = state;

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-xl text-gray-600 mb-4">Loading auction data...</div>
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
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
                            <h1 className="md:text-2xl font-bold bg-linear-to-r from-orange-800 to-blue-800 bg-clip-text text-transparent">Neo League Auction</h1>
                            <p className="text-sm font-semibold text-gray-600">Spectator Mode</p>
                        </div>

                        <div className="flex items-center space-x-4">
                            <div className="text-sm text-gray-600">
                                {auctionState?.status === 'running' ? (
                                    <div className="flex items-center space-x-2">
                                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                        <span className="text-green-600 font-semibold">Live Auction</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center space-x-2">
                                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                        <span className="text-gray-500">Auction Paused</span>
                                    </div>
                                )}
                            </div>

                            <div className="border-l border-gray-300 h-6"></div>

                            <Login />
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Welcome Section */}
                <div className='mb-6 flex justify-center'>
                    <span className="text-3xl text-center font-bold bg-linear-to-r from-orange-800 to-blue-800 bg-clip-text text-transparent">Welcome to the Neo League Auction!</span>
                </div>

                {/* Current Auction Status */}
                <div className="mb-6">
                    <AuctionBlock />
                </div>

                {/* Teams and Players Overview */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <TeamsList />
                    <PlayersList />
                </div>
            </main >
        </div >
    );
};

export default HomePage;