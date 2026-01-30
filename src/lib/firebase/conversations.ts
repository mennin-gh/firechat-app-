import {
  collection,
  doc,
  setDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  writeBatch
} from 'firebase/firestore';
import { db } from './config';

export interface Conversation {
  id: string;
  type: 'direct' | 'group';
  name ? : string;
  description ? : string;
  participants: string[];
  lastMessage ? : {
    text: string;
    senderId: string;
    timestamp: any;
  };
  createdBy: string;
  createdAt: any;
  updatedAt: any;
  photoURL ? : string;
}

export interface UserConversation {
  conversationId: string;
  userId: string;
  unreadCount: number;
  muted: boolean;
  archived: boolean;
  lastRead: any;
  customName ? : string;
  updatedAt: any;
}

export const conversationService = {
  // Create a direct conversation between two users
  async createDirectConversation(user1Id: string, user2Id: string): Promise < string > {
    const participants = [user1Id, user2Id].sort();
    const conversationId = `direct_${participants.join('_')}`;
    
    const conversationRef = doc(db, 'conversations', conversationId);
    const conversationDoc = await getDoc(conversationRef);
    
    if (!conversationDoc.exists()) {
      await setDoc(conversationRef, {
        id: conversationId,
        type: 'direct',
        participants,
        createdBy: user1Id,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      // Create user conversation entries
      const batch = writeBatch(db);
      
      participants.forEach(userId => {
        const userConvRef = doc(db, 'users', userId, 'conversations', conversationId);
        batch.set(userConvRef, {
          conversationId,
          userId,
          unreadCount: 0,
          muted: false,
          archived: false,
          lastRead: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      });
      
      await batch.commit();
    }
    
    return conversationId;
  },
  
  // Create a group conversation
  async createGroupConversation(
    creatorId: string,
    participantIds: string[],
    name: string,
    description ? : string,
    photoURL ? : string
  ): Promise < string > {
    const conversationRef = doc(collection(db, 'conversations'));
    const conversationId = conversationRef.id;
    
    await setDoc(conversationRef, {
      id: conversationId,
      type: 'group',
      name,
      description,
      photoURL,
      participants: [...participantIds, creatorId],
      createdBy: creatorId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    // Create user conversation entries
    const batch = writeBatch(db);
    const allParticipants = [...participantIds, creatorId];
    
    allParticipants.forEach(userId => {
      const userConvRef = doc(db, 'users', userId, 'conversations', conversationId);
      batch.set(userConvRef, {
        conversationId,
        userId,
        unreadCount: 0,
        muted: false,
        archived: false,
        lastRead: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    });
    
    await batch.commit();
    return conversationId;
  },
  
  // Get user's conversations
  async getUserConversations(userId: string): Promise < (Conversation & UserConversation)[] > {
    const userConvsRef = collection(db, 'users', userId, 'conversations');
    const q = query(userConvsRef, orderBy('updatedAt', 'desc'));
    const snapshot = await getDocs(q);
    
    const conversations = await Promise.all(
      snapshot.docs.map(async (userConvDoc) => {
        const userConv = userConvDoc.data() as UserConversation;
        const convRef = doc(db, 'conversations', userConv.conversationId);
        const convDoc = await getDoc(convRef);
        
        if (convDoc.exists()) {
          return {
            ...(convDoc.data() as Conversation),
            ...userConv
          };
        }
        return null;
      })
    );
    
    return conversations.filter(Boolean) as(Conversation & UserConversation)[];
  },
  
  // Listen to user's conversations in real-time
  onUserConversationsChange(userId: string, callback: (conversations: (Conversation & UserConversation)[]) => void) {
    const userConvsRef = collection(db, 'users', userId, 'conversations');
    const q = query(userConvsRef, orderBy('updatedAt', 'desc'));
    
    return onSnapshot(q, async (snapshot) => {
      const conversations = await Promise.all(
        snapshot.docs.map(async (userConvDoc) => {
          const userConv = userConvDoc.data() as UserConversation;
          const convRef = doc(db, 'conversations', userConv.conversationId);
          const convDoc = await getDoc(convRef);
          
          if (convDoc.exists()) {
            return {
              ...(convDoc.data() as Conversation),
              ...userConv
            };
          }
          return null;
        })
      );
      
      callback(conversations.filter(Boolean) as(Conversation & UserConversation)[]);
    });
  },
  
  // Update user conversation settings
  async updateUserConversation(
    userId: string,
    conversationId: string,
    updates: Partial < UserConversation >
  ) {
    const userConvRef = doc(db, 'users', userId, 'conversations', conversationId);
    await updateDoc(userConvRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  },
  
  // Add participant to group
  async addParticipant(conversationId: string, userId: string, addedBy: string) {
    const convRef = doc(db, 'conversations', conversationId);
    const convDoc = await getDoc(convRef);
    
    if (convDoc.exists()) {
      const conversation = convDoc.data() as Conversation;
      
      if (!conversation.participants.includes(userId)) {
        await updateDoc(convRef, {
          participants: arrayUnion(userId),
          updatedAt: serverTimestamp()
        });
        
        // Create user conversation entry
        const userConvRef = doc(db, 'users', userId, 'conversations', conversationId);
        await setDoc(userConvRef, {
          conversationId,
          userId,
          unreadCount: 0,
          muted: false,
          archived: false,
          lastRead: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        
        // Add system message about new participant
        const messagesRef = collection(db, 'conversations', conversationId, 'messages');
        await setDoc(doc(messagesRef), {
          text: `${addedBy} added ${userId} to the conversation`,
          senderId: 'system',
          type: 'system',
          timestamp: serverTimestamp(),
          systemType: 'member_added'
        });
      }
    }
  }
};