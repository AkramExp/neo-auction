import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useSocket } from './SocketContext.jsx';
import { toast } from 'react-toastify';

const AuctionContext = createContext();

const initialState = {
  auctionState: null,
  teams: [],
  players: [],
  error: null,
  loading: true
};

// Update the auctionReducer to handle pass updates
const auctionReducer = (state, action) => {
  switch (action.type) {
    case 'PLAYER_CREATED':
    case 'PLAYER_UPDATED':
    case 'PLAYER_DELETED':
      return {
        ...state,
        players: action.payload.players,
        error: null
      };

    case 'TEAM_CREATED':
    case 'TEAM_UPDATED':
    case 'TEAM_DELETED':
      return {
        ...state,
        teams: action.payload.teams,
        error: null
      };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'SET_STATE':
      return {
        ...state,
        auctionState: action.payload.auctionState,
        teams: action.payload.teams,
        players: action.payload.players,
        loading: false,
        error: null
      };
    case 'UPDATE_BID':
      return {
        ...state,
        auctionState: action.payload,
        error: null
      };
    case 'NEW_PLAYER':
      return {
        ...state,
        auctionState: action.payload,
        error: null
      };
    case 'PLAYER_SOLD':
      return {
        ...state,
        teams: action.payload.teams,
        players: action.payload.players,
        auctionState: {
          ...state.auctionState,
          currentPlayer: null,
          currentBid: 0,
          highBidder: null,
          passedTeams: [],
          lastAction: action.payload.lastAction
        },
        error: null
      };

    case 'PLAYER_UNSOLD':
      return {
        ...state,
        players: action.payload.players,
        auctionState: {
          ...state.auctionState,
          currentPlayer: null,
          currentBid: 0,
          highBidder: null,
          passedTeams: [],
          lastAction: action.payload.lastAction
        },
        error: null
      };
    case 'NEW_PLAYER':
      return {
        ...state,
        auctionState: {
          ...action.payload,
          lastAction: null // Clear last action when new player comes
        },
        error: null
      };
    case 'PLAYER_RELISTED':
      return {
        ...state,
        players: action.payload.players,
        error: null
      };
    case 'USER_PASSED':
      // Update the auction state with the new passed team
      const { teamId } = action.payload;
      const currentPassedTeams = state.auctionState?.passedTeams || [];

      // Check if team is already in passed teams to avoid duplicates
      const teamAlreadyPassed = currentPassedTeams.some(team => {
        const existingTeamId = team._id || team;
        return existingTeamId === teamId;
      });

      if (!teamAlreadyPassed) {
        return {
          ...state,
          auctionState: {
            ...state.auctionState,
            passedTeams: [...currentPassedTeams, teamId]
          },
          error: null
        };
      }
      return state;
    case 'PASS_UPDATE':
      // Handle server broadcast of pass updates
      return {
        ...state,
        auctionState: action.payload,
        error: null
      };
    default:
      return state;
  }
};

export const useAuction = () => {
  const context = useContext(AuctionContext);
  if (!context) {
    throw new Error('useAuction must be used within an AuctionProvider');
  }
  return context;
};

export const AuctionProvider = ({ children }) => {
  const [state, dispatch] = useReducer(auctionReducer, initialState);
  const socket = useSocket();

  useEffect(() => {
    if (!socket) {
      console.log('AuctionContext: No socket available');
      return;
    }

    console.log('AuctionContext: Setting up socket listeners');

    // Socket event listeners
    const handleAuctionState = (data) => {
      console.log('AuctionContext: Received auction:state', data);
      dispatch({ type: 'SET_STATE', payload: data });
    };

    const handlePassUpdate = (passData) => {
      console.log('AuctionContext: Received auction:passUpdate', passData);
      dispatch({ type: 'PASS_UPDATE', payload: passData });
    };

    const handlePlayerRelisted = (relistData) => {
      console.log('AuctionContext: Received auction:playerRelisted', relistData);
      dispatch({ type: 'PLAYER_RELISTED', payload: relistData });
    };

    const handleNewPlayer = (playerData) => {
      console.log('AuctionContext: Received auction:newPlayer', playerData);
      dispatch({ type: 'NEW_PLAYER', payload: playerData });
    };

    const handleBidUpdate = (bidData) => {
      console.log('AuctionContext: Received auction:bidUpdate', bidData);
      dispatch({ type: 'UPDATE_BID', payload: bidData });
    };

    const handlePlayerSold = (soldData) => {
      console.log('AuctionContext: Received auction:playerSold', soldData);
      dispatch({ type: 'PLAYER_SOLD', payload: soldData });
    };

    const handlePlayerUnsold = (unsoldData) => {
      console.log('AuctionContext: Received auction:playerUnsold', unsoldData);
      dispatch({ type: 'PLAYER_UNSOLD', payload: unsoldData });
    };

    const handleAuctionPaused = (pauseData) => {
      console.log('AuctionContext: Received auction:paused', pauseData);
      dispatch({ type: 'AUCTION_PAUSED', payload: pauseData });
    };

    const handleAuctionError = (errorMessage) => {
      toast.error(errorMessage)
      console.error('AuctionContext: Received auction:error', errorMessage);
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    };

    const handlePlayerCreated = (data) => {
      console.log('AuctionContext: Received auction:playerCreated', data);
      dispatch({ type: 'PLAYER_CREATED', payload: data });
    };

    const handlePlayerUpdated = (data) => {
      console.log('AuctionContext: Received auction:playerUpdated', data);
      dispatch({ type: 'PLAYER_UPDATED', payload: data });
    };

    const handlePlayerDeleted = (data) => {
      console.log('AuctionContext: Received auction:playerDeleted', data);
      dispatch({ type: 'PLAYER_DELETED', payload: data });
    };

    const handleTeamCreated = (data) => {
      console.log('AuctionContext: Received auction:teamCreated', data);
      dispatch({ type: 'TEAM_CREATED', payload: data });
    };

    const handleTeamUpdated = (data) => {
      console.log('AuctionContext: Received auction:teamUpdated', data);
      dispatch({ type: 'TEAM_UPDATED', payload: data });
    };

    const handleTeamDeleted = (data) => {
      console.log('AuctionContext: Received auction:teamDeleted', data);
      dispatch({ type: 'TEAM_DELETED', payload: data });
    };


    // Set up all listeners
    socket.on('auction:state', handleAuctionState);
    socket.on('auction:newPlayer', handleNewPlayer);
    socket.on('auction:bidUpdate', handleBidUpdate);
    socket.on('auction:playerSold', handlePlayerSold);
    socket.on('auction:playerUnsold', handlePlayerUnsold);
    socket.on('auction:paused', handleAuctionPaused);
    socket.on('auction:error', handleAuctionError);
    socket.on('auction:playerRelisted', handlePlayerRelisted);
    socket.on('auction:passUpdate', handlePassUpdate);
    socket.on('auction:playerCreated', handlePlayerCreated);
    socket.on('auction:playerUpdated', handlePlayerUpdated);
    socket.on('auction:playerDeleted', handlePlayerDeleted);
    socket.on('auction:teamCreated', handleTeamCreated);
    socket.on('auction:teamUpdated', handleTeamUpdated);
    socket.on('auction:teamDeleted', handleTeamDeleted);


    // Request initial state when socket connects
    const handleConnect = () => {
      console.log('AuctionContext: Socket connected, requesting state');
      socket.emit('auction:getState');
    };

    socket.on('connect', handleConnect);

    // If socket is already connected, request state immediately
    if (socket.connected) {
      console.log('AuctionContext: Socket already connected, requesting state');
      socket.emit('auction:getState');
    }

    return () => {
      console.log('AuctionContext: Cleaning up socket listeners');
      socket.off('auction:state', handleAuctionState);
      socket.off('auction:newPlayer', handleNewPlayer);
      socket.off('auction:bidUpdate', handleBidUpdate);
      socket.off('auction:playerSold', handlePlayerSold);
      socket.off('auction:playerUnsold', handlePlayerUnsold);
      socket.off('auction:paused', handleAuctionPaused);
      socket.off('auction:error', handleAuctionError);
      socket.off('connect', handleConnect);
      socket.off('auction:playerRelisted', handlePlayerRelisted);
      socket.off('auction:passUpdate', handlePassUpdate);
      socket.off('auction:playerCreated', handlePlayerCreated);
      socket.off('auction:playerUpdated', handlePlayerUpdated);
      socket.off('auction:playerDeleted', handlePlayerDeleted);
      socket.off('auction:teamCreated', handleTeamCreated);
      socket.off('auction:teamUpdated', handleTeamUpdated);
      socket.off('auction:teamDeleted', handleTeamDeleted);
    };
  }, [socket]);

  return (
    <AuctionContext.Provider value={{ state, dispatch }}>
      {children}
    </AuctionContext.Provider>
  );
};