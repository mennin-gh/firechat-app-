import { useState, useEffect } from 'react';
import { auth } from '../lib/firebase/config';
import { userService } from '../lib/firebase/users';
import { onAuthStateChanged } from 'firebase/auth';

export const useUserPresence = () => {
  const [onlineUsers, setOnlineUsers] = useState < string[] > ([]);
  const [awayUsers, setAwayUsers] = useState < string[] > ([]);
  const [offlineUsers, setOfflineUsers] = useState < string[] > ([]);
  const [loading, setLoading] = useState(true);
  
  // Set current user as online when authenticated
  useEffect(() => {
    const handleAuthChange = async (user: any) => {
      if (user) {
        // Set user as online
        await userService.updateUserStatus(user.uid, 'online');
        
        // Set up disconnect handler
        window.addEventListener('beforeunload', async () => {
          await userService.updateUserStatus(user.uid, 'offline');
        });
        
        // Handle visibility change (away/online)
        const handleVisibilityChange = async () => {
          if (document.hidden) {
            await userService.updateUserStatus(user.uid, 'away');
          } else {
            await userService.updateUserStatus(user.uid, 'online');
          }
        };
        
        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        return () => {
          document.removeEventListener('visibilitychange', handleVisibilityChange);
          userService.updateUserStatus(user.uid, 'offline');
        };
      }
    };
    
    const unsubscribe = onAuthStateChanged(auth, handleAuthChange);
    return () => unsubscribe();
  }, []);
  
  // Listen to all users' presence
  useEffect(() => {
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }
    
    const fetchAndListen = async () => {
      try {
        const allUsers = await userService.getAllUsers(auth.currentUser!.uid);
        
        // Initialize state
        const online: string[] = [];
        const away: string[] = [];
        const offline: string[] = [];
        
        allUsers.forEach(user => {
          if (user.status === 'online') online.push(user.uid);
          else if (user.status === 'away') away.push(user.uid);
          else offline.push(user.uid);
        });
        
        setOnlineUsers(online);
        setAwayUsers(away);
        setOfflineUsers(offline);
        setLoading(false);
        
        // Listen to each user's presence changes
        const unsubscribes = allUsers.map(user =>
          userService.onUserPresenceChange(user.uid, (updatedUser) => {
            if (updatedUser) {
              setOnlineUsers(prev =>
                updatedUser.status === 'online' ?
                [...prev.filter(id => id !== user.uid), user.uid] :
                prev.filter(id => id !== user.uid)
              );
              setAwayUsers(prev =>
                updatedUser.status === 'away' ?
                [...prev.filter(id => id !== user.uid), user.uid] :
                prev.filter(id => id !== user.uid)
              );
              setOfflineUsers(prev =>
                updatedUser.status === 'offline' ?
                [...prev.filter(id => id !== user.uid), user.uid] :
                prev.filter(id => id !== user.uid)
              );
            }
          })
        );
        
        return () => unsubscribes.forEach(unsub => unsub());
      } catch (error) {
        console.error('Error setting up presence:', error);
        setLoading(false);
      }
    };
    
    fetchAndListen();
  }, [auth.currentUser]);
  
  const getUserStatus = (userId: string): 'online' | 'away' | 'offline' | null => {
    if (onlineUsers.includes(userId)) return 'online';
    if (awayUsers.includes(userId)) return 'away';
    if (offlineUsers.includes(userId)) return 'offline';
    return null;
  };
  
  return {
    onlineUsers,
    awayUsers,
    offlineUsers,
    getUserStatus,
    loading
  };
};