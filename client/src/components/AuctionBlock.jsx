import React from 'react';
import { useAuction } from '../context/AuctionContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const AuctionBlock = () => {
  const { state } = useAuction();
  const { user } = useAuth();
  const { auctionState, players, teams } = state;

  // Check if we have a recent sale/unsold result
  const hasRecentResult = auctionState?.lastAction &&
    (auctionState.lastAction.type === 'sold' ||
      auctionState.lastAction.type === 'unsold');



  // If no current player but we have a recent result, show the result
  if (!auctionState?.currentPlayer && hasRecentResult) {
    const lastAction = auctionState.lastAction;

    if (lastAction.type === 'sold') {
      const soldPlayer = players.find(p => p._id === lastAction.playerId);
      const buyingTeam = teams.find(t => t._id === lastAction.teamId);

      return (
        <div className="bg-white rounded-lg md:rounded-2xl shadow-lg md:shadow-2xl p-4 md:p-8 border border-gray-100 mx-2 md:mx-0">
          <div className="text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-green-800 mb-3 md:mb-4">Player Sold!</h2>

            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl md:rounded-2xl p-4 md:p-6 border border-green-200 mb-4 md:mb-6">
              <p className="text-lg md:text-xl text-green-700 mb-3 md:mb-4">
                <span className="font-bold text-xl md:text-2xl block md:inline">{soldPlayer?.name}</span>
                <span className="hidden md:inline"> has been acquired by </span>
                <span className="md:hidden block">acquired by</span>
                <span className="font-bold text-xl md:text-2xl block md:inline mt-1 md:mt-0 text-green-800">{buyingTeam?.name}</span>
              </p>

              <div className="bg-white rounded-lg md:rounded-xl p-3 md:p-4 inline-block border border-green-300 font-semibold">
                <p className="text-green-600 text-base md:text-lg">Sold for</p>
                <p className="text-xl md:text-2xl text-green-700 font-bold">${lastAction.amount?.toLocaleString()}</p>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg md:rounded-xl p-3 md:p-4 border border-blue-200 inline-block">
              <p className="text-blue-600 font-semibold text-xs md:text-sm">
                ⏳ Waiting for next player...
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (lastAction.type === 'unsold') {
      const unsoldPlayer = players.find(p => p._id === lastAction.playerId);

      return (
        <div className="bg-white rounded-lg md:rounded-2xl shadow-lg md:shadow-2xl p-4 md:p-8 border border-gray-100 mx-2 md:mx-0">
          <div className="text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-yellow-800 mb-3 md:mb-4">Player Goes Unsold</h2>

            <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl md:rounded-2xl p-4 md:p-6 border border-yellow-200 mb-4 md:mb-6">
              <p className="text-lg md:text-xl text-yellow-700 mb-3">
                <span className="font-bold text-xl md:text-2xl block">{unsoldPlayer?.name}</span>
                <span className="text-base md:text-lg mt-1 block">did not receive any qualifying bids</span>
              </p>
              <div className="bg-white rounded-lg md:rounded-xl p-3 md:p-4 inline-block border border-yellow-300">
                <p className="text-yellow-600 text-base md:text-lg font-semibold">Base Price</p>
                <p className="text-xl md:text-2xl font-bold text-yellow-700">${unsoldPlayer?.basePrice?.toLocaleString()}</p>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg md:rounded-xl p-3 md:p-4 border border-blue-200 inline-block">
              <p className="text-blue-600 font-semibold text-xs md:text-sm">
                ⏳ Waiting for next player...
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (!auctionState?.currentPlayer) {
      return (
        <div className="bg-white rounded-lg shadow-lg p-6 text-center">
          <h2 className="text-2xl font-bold text-gray-600 mb-4">Auction Block</h2>
          <div className="bg-gray-50 rounded-lg p-8">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <p className="text-gray-500 text-lg">No player currently on the block</p>
            <p className="text-gray-400 text-sm mt-2">Waiting for admin to send a player to auction...</p>
          </div>
        </div>
      );
    }
  }

  // Current player is on the block
  const currentPlayer = players.find(p => p._id === auctionState.currentPlayer?._id);
  const highBidderTeam = teams.find(t => t._id === auctionState.highBidder?._id || t._id === auctionState.highBidder);
  const isFirstBid = currentPlayer && auctionState.currentBid === currentPlayer.basePrice && !auctionState.highBidder;
  const passedTeamCount = auctionState.passedTeams?.length || 0;
  const passedTeamNames = auctionState.passedTeams
    ?.map(passedTeam => {
      const teamId = passedTeam._id || passedTeam;
      const team = teams.find(t => t._id === teamId);
      return team ? team.name : 'Unknown Team';
    })
    .filter(name => name !== 'Unknown Team') || [];

  return (
    <div className="bg-white rounded-lg md:rounded-2xl shadow-lg md:shadow-xl p-4 md:p-6 border border-gray-100 mx-2 md:mx-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 md:mb-4">
        <div className="flex items-center space-x-2 md:space-x-3">
          <div>
            <p className="text-lg md:text-xl font-bold text-gray-900">Live bidding</p>
          </div>
        </div>
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-2 md:px-3 py-1 rounded-full text-xs font-semibold">
          Active
        </div>
      </div>

      {/* Player Info */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg md:rounded-xl p-3 md:p-4 border border-blue-200 mb-3 md:mb-4">
        {/* Player Card */}
        <div className="bg-white p-3 rounded-lg md:rounded-xl flex items-center justify-between col-span-1 xs:col-span-2 lg:col-span-1">
          <div className="flex items-center space-x-2 md:space-x-3 min-w-0 flex-1">
            <div className="hidden w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-blue-600 to-purple-700 rounded-lg md:rounded-xl sm:flex items-center justify-center shadow-md shrink-0">
              <span className="text-white font-bold text-base md:text-lg">
                {currentPlayer?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-base md:text-lg font-bold text-gray-900 truncate">{currentPlayer?.name}</h3>
              <div className="flex items-center space-x-1 md:space-x-2 mt-1">
                <div className='flex items-center gap-2'>
                  {currentPlayer?.position.split(",").map((position, index) => <span key={index} className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                    {position}
                  </span>)}
                </div>

                <span className="bg-green-200 text-green-700 px-2 py-1 rounded-full text-xs font-semibold">
                  ${currentPlayer?.basePrice?.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {isFirstBid && (
            <span className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-2 md:px-3 py-1 rounded-full text-xs font-semibold flex-shrink-0 ml-2">
              First Bid
            </span>
          )}
        </div>

        {/* Current Bid */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-lg md:rounded-xl p-2 md:p-3 border border-green-200 text-center">
          <p className="text-green-700 text-xs md:text-sm font-semibold mb-1">Current Bid</p>
          <p className="text-lg md:text-xl font-bold text-green-800">${auctionState.currentBid?.toLocaleString()}</p>
          {isFirstBid && (
            <p className="text-green-600 text-xs mt-1">Base Price</p>
          )}
        </div>

        {/* Highest Bidder */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-100 rounded-lg md:rounded-xl p-2 md:p-3 border border-purple-200 text-center">
          <p className="text-purple-700 text-xs md:text-sm font-semibold mb-1">Highest Bidder</p>
          <p className="text-lg md:text-xl font-bold text-purple-800 truncate">
            {highBidderTeam?.name || (
              <span className="text-purple-700 text-base md:text-lg">
                {isFirstBid ? 'None' : 'No bids'}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Passed Teams */}
      {passedTeamNames.length > 0 && (
        <div className="mt-4 md:mt-6 bg-yellow-50 border border-yellow-200 rounded-lg md:rounded-xl p-3 md:p-4">
          <div className="flex flex-col xs:flex-row xs:items-center gap-2 md:gap-3">
            <h4 className="font-semibold text-yellow-800 text-base md:text-lg whitespace-nowrap">Passed</h4>
            <div className="flex flex-wrap gap-1 md:gap-2">
              {passedTeamNames.map((teamName, index) => (
                <span key={index} className="bg-yellow-100 text-yellow-800 px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-medium">
                  {teamName}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* First Bid Call to Action */}
      {isFirstBid && (
        <div className="mt-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg p-2 md:p-3">
          <div className="flex items-center justify-center space-x-1 md:space-x-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <p className="text-xs md:text-sm font-semibold text-center">Start bidding at base price!</p>
          </div>
        </div>
      )}

      {/* Timer if available */}
      {auctionState.timer > 0 && (
        <div className="mt-3 bg-gradient-to-br from-orange-50 to-red-100 rounded-lg p-2 md:p-3 border border-orange-200 text-center">
          <p className="text-orange-700 text-xs font-semibold mb-1">Time Remaining</p>
          <p className="text-base md:text-lg font-bold text-orange-800">{auctionState.timer}s</p>
        </div>
      )}
    </div>
  );
};

export default AuctionBlock;