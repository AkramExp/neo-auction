// ...existing code...
import React, { useState, useEffect } from 'react';
import { useAuction } from '../context/AuctionContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';
import { toast } from 'react-toastify';

const BiddingInterface = () => {
  const [bidAmount, setBidAmount] = useState('');
  const [popup, setPopup] = useState({ show: false, type: '', message: '' });
  const { state, dispatch } = useAuction();
  const { user } = useAuth();
  const socket = useSocket();

  const { auctionState } = state;
  const currentBid = auctionState?.currentBid || 0;
  const myTeam = user?.team;
  const currentPlayer = auctionState?.currentPlayer;

  // Close popup after 3 seconds
  useEffect(() => {
    if (popup.show) {
      const timer = setTimeout(() => {
        setPopup({ show: false, type: '', message: '' });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [popup.show]);

  // Don't show bidding interface for public users or users without teams
  if (!user || user.role !== 'owner' || !myTeam) {
    return null;
  }

  // Check if my team has passed on the current player
  const hasPassed = myTeam && auctionState?.passedTeams?.some(
    team => {
      const teamId = team._id || team;
      return teamId === myTeam._id;
    }
  );

  // Check if my team is the current high bidder
  const isHighBidder = myTeam && auctionState?.highBidder && (
    (auctionState.highBidder._id === myTeam._id) ||
    (auctionState.highBidder === myTeam._id)
  );

  // Check if this is the first bid
  const isFirstBid = currentPlayer && currentBid === currentPlayer.basePrice && !auctionState?.highBidder;

  useEffect(() => {
    if (isFirstBid && currentPlayer && !hasPassed && !isHighBidder) {
      setBidAmount(currentPlayer.basePrice.toString());
    } else {
      setBidAmount('');
    }
  }, [isFirstBid, currentPlayer, hasPassed, isHighBidder, auctionState?.currentPlayer?._id]);

  const showPopup = (type, message) => {
    setPopup({ show: true, type, message });
  };

  const handleBid = () => {
    if (!bidAmount || !myTeam || hasPassed) return;

    const amount = parseInt(bidAmount, 10);

    if (amount > myTeam.budget) {
      toast.error('Bid amount exceeds your budget')
      return;
    }

    if (isFirstBid && amount !== currentPlayer.basePrice) {
      toast.error(`First bid must be exactly at base price: $${currentPlayer.basePrice.toLocaleString()}`)
      return;
    }

    if (!isFirstBid && amount <= currentBid) {
      toast.error('Bid must be higher than current bid')
      return;
    }

    socket.emit('user:placeBid', {
      amount,
      teamId: myTeam._id
    });

    setBidAmount('');
  };

  const handlePass = () => {
    if (!myTeam || hasPassed || isHighBidder) return;

    // Show confirmation popup instead of window.confirm
    setPopup({
      show: true,
      type: 'confirmation',
      message: 'Are you sure you want to pass on this player? You will not be able to bid on them again.',
      onConfirm: () => {
        // Update global state immediately for all users
        dispatch({
          type: 'USER_PASSED',
          payload: { teamId: myTeam._id }
        });

        // Send to server to broadcast to all users
        socket.emit('user:pass', myTeam._id);

        setPopup({ show: false, type: '', message: '' });
      },
      onCancel: () => {
        setPopup({ show: false, type: '', message: '' });
      }
    });
  };

  const suggestedBids = isFirstBid
    ? [currentPlayer.basePrice]
    : [
      currentBid + 500,
      currentBid + 1000,
      currentBid + 1500,
      currentBid + 2000
    ].filter(amount => amount <= (myTeam?.budget || 0));

  // Parse bid amount and compute remaining budget for display
  const parsedBidAmount = parseInt(bidAmount, 10) || 0;
  const remainingBudget = myTeam ? Math.max(myTeam.budget - parsedBidAmount, 0) : 0;

  // Don't show if no team, auction not running, or no player
  if (!myTeam || auctionState?.status !== 'running' || !auctionState?.currentPlayer) {
    return null;
  }

  // Show passed message
  if (hasPassed) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
        <div className="text-center p-8 bg-linear-to-br from-yellow-50 to-amber-50 border-2 border-yellow-200 rounded-2xl">
          <h3 className="text-xl font-bold text-amber-800 mb-2">You Have Passed</h3>
          <p className="text-amber-700 mb-4">
            You cannot bid on <span className="font-semibold">{currentPlayer.name}</span>
          </p>
          <div className="bg-amber-100 border border-amber-300 rounded-lg p-3 inline-block">
            <p className="text-amber-800 text-sm font-medium">
              ⏳ Wait for the next player
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isHighBidder) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
        <div className="bg-linear-to-r from-green-500 to-emerald-600 text-white rounded-2xl p-6 text-center shadow-lg">
          <div className="flex items-center justify-center space-x-3 mb-2">
            <h3 className="text-xl font-bold">You're in the Lead!</h3>
          </div>
          <p className="text-green-100 text-lg font-semibold">
            Current Bid: <span className="text-white">${currentBid.toLocaleString()}</span>
          </p>
          <p className="text-green-200 text-sm mt-2">
            Waiting for other teams to respond...
          </p>
        </div>
      </div>
    );
  }

  // Popup component
  const Popup = () => {
    if (!popup.show) return null;

    if (popup.type === 'confirmation') {
      return (
        <div className="fixed inset-0 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900">Confirm Pass</h3>
            </div>

            <p className="text-gray-600 mb-6">{popup.message}</p>

            <div className="flex space-x-3">
              <button
                onClick={popup.onCancel}
                className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-xl font-semibold hover:bg-gray-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={popup.onConfirm}
                className="flex-1 bg-linear-to-r from-red-500 to-pink-600 text-white px-4 py-2 rounded-xl font-semibold hover:shadow-lg transition-all cursor-pointer"
              >
                Yes, Pass
              </button>
            </div>
          </div>
        </div>
      );
    }

    const popupStyles = {
      success: 'bg-green-500 border-green-600',
      error: 'bg-red-500 border-red-600',
      warning: 'bg-yellow-500 border-yellow-600'
    };

    const popupIcons = {
      success: (
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ),
      error: (
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      ),
      warning: (
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      )
    };

    return (
      <div className="fixed top-4 right-4 z-50 transform transition-all duration-300 animate-in slide-in-from-right">
        <div className={`${popupStyles[popup.type]} text-white rounded-2xl shadow-2xl p-4 min-w-80 border-2`}>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center shrink-0">
              {popupIcons[popup.type]}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">{popup.message}</p>
            </div>
            <button
              onClick={() => setPopup({ show: false, type: '', message: '' })}
              className="w-6 h-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30 transition-colors cursor-pointer"
            >
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Show full bidding interface
  return (
    <>
      <Popup />

      <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">Bidding Interface</h3>
            <p className="text-gray-600 text-sm mt-1">Place your bids for {currentPlayer.name}</p>
          </div>
          <div className="hidden md:block bg-linear-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium">
            Active Bidding
          </div>
        </div>

        <div className="space-y-6">
          {/* Bid Input Section */}
          <div className="bg-linear-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-100">
            <div className="flex flex-col lg:flex-row gap-4 items-center">
              <div className="flex-1 w-full">
                <div className="relative">
                  <div className="absolute inset-y-0 -top-7 left-0 pl-5 flex items-center pointer-events-none">
                    <span className="text-gray-500 font-bold">$</span>
                  </div>
                  <input
                    type="number"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    placeholder={isFirstBid
                      ? `Base Price: $${currentPlayer.basePrice.toLocaleString()}`
                      : `Minimum: $${(currentBid + 100).toLocaleString()}`
                    }
                    className="w-full border-2 border-gray-300 bg-white rounded-xl pl-8 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    min={isFirstBid ? currentPlayer.basePrice : currentBid + 100}
                    max={myTeam.budget}
                  />

                  {/* Remaining budget display */}
                  <div className="mt-2 text-sm">
                    <span className="text-gray-600">
                      Remaining Budget:
                      <span className={`font-semibold ml-2 ${parsedBidAmount > myTeam.budget ? 'text-red-600' : 'text-green-600'}`}>
                        ${remainingBudget.toLocaleString()}
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 w-full lg:w-auto">
                <button
                  onClick={handleBid}
                  disabled={
                    !bidAmount ||
                    parsedBidAmount > myTeam.budget ||
                    (isFirstBid && parsedBidAmount !== currentPlayer.basePrice) ||
                    (!isFirstBid && parsedBidAmount <= currentBid) ||
                    (!isFirstBid && parsedBidAmount < currentBid + 100)
                  }
                  className="bg-linear-to-r from-green-500 to-emerald-600 text-white px-6 py-2 rounded-xl font-semibold text-sm hover:shadow-lg disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
                >
                  {isFirstBid ? 'Start Bid' : 'Place Bid'}
                </button>

                <button
                  onClick={handlePass}
                  className="bg-linear-to-r from-red-500 to-pink-600 text-white px-6 py-2 rounded-xl font-semibold text-sm hover:shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
                >
                  Pass
                </button>
              </div>
            </div>
          </div>

          {/* Quick Bid Buttons */}
          {suggestedBids.length > 0 && (
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
              <h3 className='text-base text-blue-600 font-semibold mb-2 pl-2'>Quick Bids</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {suggestedBids.map(amount => (
                  <button
                    key={amount}
                    onClick={() => setBidAmount(amount.toString())}
                    className="bg-white border-2 border-blue-200 text-blue-700 px-4 py-3 rounded-xl font-semibold hover:bg-blue-50 hover:border-blue-300 hover:shadow-md transition-all duration-200 hover:scale-105 cursor-pointer"
                  >
                    ${amount.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Bid Requirements */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div>
                <p className="text-yellow-800 font-semibold text-sm">
                  {isFirstBid
                    ? `First bid must be exactly at base price: $${currentPlayer.basePrice.toLocaleString()}`
                    : `Bid must be 100 higher than current bid: $${(currentBid + 100).toLocaleString()}`
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default BiddingInterface;