import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authAPI } from '../services/api.js';
import { connectSocket, disconnectSocket, socket } from '../services/socket.js';

const AuthContext = createContext();

const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  loading: false,
  error: null,
  socketConnected: false
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, loading: true, error: null };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        loading: false,
        user: action.payload.user,
        token: action.payload.token,
        error: null
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        loading: false,
        user: null,
        token: null,
        error: action.payload
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        error: null,
        socketConnected: false
      };
    case 'SOCKET_CONNECTED':
      return {
        ...state,
        socketConnected: true
      };
    case 'SOCKET_DISCONNECTED':
      return {
        ...state,
        socketConnected: false
      };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    // Connect socket for public viewing (read-only)
    if (!state.token) {
      console.log('AuthContext: Connecting socket for public viewing');
      socket.connect();
    }

    // Socket connection status listeners
    const handleConnect = () => {
      console.log('AuthContext: Socket connected');
      dispatch({ type: 'SOCKET_CONNECTED' });
    };

    const handleDisconnect = () => {
      console.log('AuthContext: Socket disconnected');
      dispatch({ type: 'SOCKET_DISCONNECTED' });
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    // Connect socket if we have a token (logged in user)
    if (state.token) {
      console.log('AuthContext: Connecting socket with token');
      connectSocket(state.token);
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
    };
  }, [state.token]);

  const login = async (credentials) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      const response = await authAPI.login(credentials);
      const { token, user } = response.data;

      localStorage.setItem('token', token);

      // Connect socket after successful login
      connectSocket(token);

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user, token }
      });

      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: message
      });
      return { success: false, error: message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    disconnectSocket();

    // Reconnect socket for public viewing after logout
    setTimeout(() => {
      socket.connect();
    }, 100);

    dispatch({ type: 'LOGOUT' });
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  return (
    <AuthContext.Provider value={{
      ...state,
      login,
      logout,
      clearError
    }}>
      {children}
    </AuthContext.Provider>
  );
};