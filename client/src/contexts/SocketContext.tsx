import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  joinCentreRoom: (centreId: string) => void;
  leaveCentreRoom: (centreId: string) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // In dev Vite proxies /socket.io to backend on port 5000
    const socketInstance = io(window.location.origin, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    socketInstance.on('connect', () => {
      console.log('⚡ Socket connected to server:', socketInstance.id);
      setIsConnected(true);

      // Join personal user room if logged in
      if (user?.id) {
        socketInstance.emit('join:user', user.id);
      }
    });

    socketInstance.on('disconnect', () => {
      console.log('⚡ Socket disconnected');
      setIsConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  // Re-join user room whenever user logs in
  useEffect(() => {
    if (socket && isConnected && user?.id) {
      socket.emit('join:user', user.id);
    }
  }, [socket, isConnected, user?.id]);

  const joinCentreRoom = (centreId: string) => {
    if (socket && centreId) {
      socket.emit('join:centre', centreId);
    }
  };

  const leaveCentreRoom = (centreId: string) => {
    if (socket && centreId) {
      socket.emit('leave:centre', centreId);
    }
  };

  return (
    <SocketContext.Provider value={{ socket, isConnected, joinCentreRoom, leaveCentreRoom }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
