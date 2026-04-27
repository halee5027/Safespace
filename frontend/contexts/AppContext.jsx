import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api, endpoints } from '../api/client';
import { fallbackUsers } from '../data/demo';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [users, setUsers] = useState(fallbackUsers);
  const [selectedUserId, setSelectedUserId] = useState(fallbackUsers[0]._id);
  const [peerUserId, setPeerUserId] = useState(fallbackUsers[1]._id);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function loadUsers() {
      try {
        await api.post(endpoints.seedDemo);
        const { data } = await api.get(endpoints.users);
        if (data?.users?.length) {
          setUsers(data.users);
          setSelectedUserId((prev) => prev || data.users[0]._id);
          const peer = data.users.find((u) => String(u._id) !== String(data.users[0]._id));
          setPeerUserId(peer?._id || data.users[0]._id);
        }
      } catch (error) {
        console.warn('Using fallback users:', error.message);
      } finally {
        setIsReady(true);
      }
    }

    loadUsers();
  }, []);

  const selectedUser = useMemo(
    () => users.find((u) => String(u._id) === String(selectedUserId)) || users[0],
    [users, selectedUserId]
  );

  const peerUser = useMemo(
    () => users.find((u) => String(u._id) === String(peerUserId)) || users[1] || users[0],
    [users, peerUserId]
  );

  useEffect(() => {
    if (!selectedUser?._id) return;
    if (String(peerUser?._id) === String(selectedUser._id)) {
      const nextPeer = users.find((u) => String(u._id) !== String(selectedUser._id));
      if (nextPeer?._id) setPeerUserId(nextPeer._id);
    }
  }, [users, selectedUser?._id, peerUser?._id]);

  const value = {
    users,
    selectedUser,
    peerUser,
    isReady,
    setSelectedUserId,
    setPeerUserId
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
}
