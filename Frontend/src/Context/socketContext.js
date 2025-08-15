import { createContext, useContext, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { useAuth } from './authContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { token, isAuthenticated } = useAuth();
  const socket = useRef(null);

  useEffect(() => {
    if (isAuthenticated && token) {
      // Connect to socket server
      socket.current = io('http://localhost:5000', {
        auth: {
          token: token
        }
      });

      socket.current.on('connect', () => {
        console.log('Connected to server');
      });

      socket.current.on('disconnect', () => {
        console.log('Disconnected from server');
      });

      socket.current.on('error', (error) => {
        console.error('Socket error:', error);
        // Attempt to reconnect on error
        if (socket.current) {
          socket.current.connect();
        }
      });

      return () => {
        if (socket.current) {
          socket.current.disconnect();
          socket.current = null;
        }
      };
    }
  }, [isAuthenticated, token]);

  const value = {
    socket: socket.current
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  return context;
};
