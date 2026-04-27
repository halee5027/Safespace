import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import { API_BASE_URL } from '../api/client';
import { useAppContext } from './AppContext';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { selectedUser } = useAppContext();
  const [socket, setSocket] = useState(null);
  const [liveAlerts, setLiveAlerts] = useState([]);

  useEffect(() => {
    if (!selectedUser?._id) return;

    const nextSocket = io(API_BASE_URL, {
      query: { userId: selectedUser._id }
    });

    nextSocket.on('connect', () => {
      nextSocket.emit('join:user-room', { userId: selectedUser._id });
    });

    nextSocket.on('alert:new', (alert) => {
      setLiveAlerts((prev) => [alert, ...prev].slice(0, 20));
    });

    setSocket(nextSocket);

    return () => {
      nextSocket.disconnect();
    };
  }, [selectedUser?._id]);

  const value = useMemo(
    () => ({
      socket,
      liveAlerts,
      clearLiveAlerts: () => setLiveAlerts([])
    }),
    [socket, liveAlerts]
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocketContext() {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocketContext must be used within SocketProvider');
  return context;
}
