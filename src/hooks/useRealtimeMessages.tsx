import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot,
  addDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase/config';

export interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  senderPhotoURL?: string;
  timestamp: Timestamp;
  type: 'text' | 'image' | 'file' | 'voice';
  readBy: string[];
  status: 'sent' | 'delivered' | 'read';
}

export const useRealtimeMessages = (conversationId: string, messageLimit: number = 50) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Listen to messages in real-time
  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const messagesRef = collection(db, 'conversations', conversationId, 'messages');
      const q = query(
        messagesRef,
        orderBy('timestamp', 'desc'),
        limit(messageLimit)
      );

      const unsubscribe = onSnapshot(q, 
        (snapshot) => {
          const newMessages = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as Message)).reverse();
          
          setMessages(newMessages);
          setLoading(false);
        },
        (err) => {
          setError(err.message);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }, [conversationId, messageLimit]);

  // Send a new message
  const sendMessage = async (
    text: string,
    senderId: string,
    senderName: string,
    senderPhotoURL?: string
  ) => {
    if (!conversationId) throw new Error('No conversation selected');

    try {
      const messagesRef = collection(db, 'conversations', conversationId, 'messages');
      
      const messageData = {
        text,
        senderId,
        senderName,
        senderPhotoURL,
        timestamp: serverTimestamp(),
        type: 'text' as const,
        readBy: [senderId],
        status: 'sent' as const
      };

      const docRef = await addDoc(messagesRef, messageData);
      return docRef.id;
    } catch (err: any) {
      throw new Error(`Failed to send message: ${err.message}`);
    }
  };

  return {
    messages,
    loading,
    error,
    sendMessage
  };
};