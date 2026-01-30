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
  name?: string;
  description?: string;
  participants: string[];
  lastMessage?: {
    text: string;
    senderId: string;
    timestamp: any;
  };
  createdBy: string;
  createdAt: any;
  updatedAt: any;
  photoURL?: string;
}

export interface UserConversation {
  conversationId: string;
  userId: string;
  unreadCount: number;
  muted: boolean;
  archived: boolean;
  lastRead: any;
  customName?: string;
  updatedAt: any;
}

export const conversationService = {
  // === USES: setDoc, getDoc, writeBatch, serverTimestamp, arrayUnion ===
  async createDirectConversation(user1Id: string, user2Id: string): Promise<string> {
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

  // === USES: collection, setDoc, writeBatch, serverTimestamp ===
  async createGroupConversation(
    creatorId: string, 
    participantIds: string[], 
    name: string,
    description?: string,
    photoURL?: string
  ): Promise<string> {
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

  // === USES: getDocs, query, orderBy, collection ===
  async getUserConversations(userId: string): Promise<(Conversation & UserConversation)[]> {
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
    
    return conversations.filter(Boolean) as (Conversation & UserConversation)[];
  },

  // === USES: onSnapshot, query, orderBy, collection ===
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
      
      callback(conversations.filter(Boolean) as (Conversation & UserConversation)[]);
    });
  },

  // === USES: updateDoc, serverTimestamp ===
  async updateUserConversation(
    userId: string, 
    conversationId: string, 
    updates: Partial<UserConversation>
  ) {
    const userConvRef = doc(db, 'users', userId, 'conversations', conversationId);
    await updateDoc(userConvRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  },

  // === USES: getDoc, updateDoc, arrayUnion, setDoc, serverTimestamp, collection, doc ===
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
  },

  // === NEW: USES arrayRemove ===
  async removeParticipant(conversationId: string, userId: string, removedBy: string) {
    const convRef = doc(db, 'conversations', conversationId);
    const convDoc = await getDoc(convRef);
    
    if (convDoc.exists()) {
      const conversation = convDoc.data() as Conversation;
      
      if (conversation.participants.includes(userId)) {
        await updateDoc(convRef, {
          participants: arrayRemove(userId),
          updatedAt: serverTimestamp()
        });
        
        // Add system message about removal
        const messagesRef = collection(db, 'conversations', conversationId, 'messages');
        await setDoc(doc(messagesRef), {
          text: `${removedBy} removed ${userId} from the conversation`,
          senderId: 'system',
          type: 'system',
          timestamp: serverTimestamp(),
          systemType: 'member_removed'
        });
        
        // Note: We keep the userConversation document for history
        // but mark it as archived
        const userConvRef = doc(db, 'users', userId, 'conversations', conversationId);
        await updateDoc(userConvRef, {
          archived: true,
          updatedAt: serverTimestamp()
        });
      }
    }
  },

  // === NEW: USES where and limit ===
  async searchConversations(userId: string, searchTerm: string, maxResults: number = 10): Promise<(Conversation & UserConversation)[]> {
    // Get user's conversations first
    const userConvsRef = collection(db, 'users', userId, 'conversations');
    const q = query(userConvsRef, limit(maxResults));
    const snapshot = await getDocs(q);
    
    const conversations = await Promise.all(
      snapshot.docs.map(async (userConvDoc) => {
        const userConv = userConvDoc.data() as UserConversation;
        const convRef = doc(db, 'conversations', userConv.conversationId);
        const convDoc = await getDoc(convRef);
        
        if (convDoc.exists()) {
          const conversation = convDoc.data() as Conversation;
          
          // Search in conversation name or participants
          const matchesSearch = 
            conversation.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            conversation.description?.toLowerCase().includes(searchTerm.toLowerCase());
          
          if (matchesSearch) {
            return {
              ...conversation,
              ...userConv
            };
          }
        }
        return null;
      })
    );
    
    return conversations.filter(Boolean) as (Conversation & UserConversation)[];
  },

  // === NEW: USES where for filtering ===
  async getGroupConversations(userId: string): Promise<Conversation[]> {
    const userConvsRef = collection(db, 'users', userId, 'conversations');
    const snapshot = await getDocs(userConvsRef);
    
    const conversations = await Promise.all(
      snapshot.docs.map(async (userConvDoc) => {
        const userConv = userConvDoc.data() as UserConversation;
        const convRef = doc(db, 'conversations', userConv.conversationId);
        const convDoc = await getDoc(convRef);
        
        if (convDoc.exists()) {
          const conversation = convDoc.data() as Conversation;
          if (conversation.type === 'group') {
            return conversation;
          }
        }
        return null;
      })
    );
    
    return conversations.filter(Boolean) as Conversation[];
  },

  // === NEW: USES limit for pagination ===
  async getRecentConversations(userId: string, count: number = 5): Promise<(Conversation & UserConversation)[]> {
    const userConvsRef = collection(db, 'users', userId, 'conversations');
    const q = query(
      userConvsRef, 
      orderBy('updatedAt', 'desc'),
      limit(count)
    );
    
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
    
    return conversations.filter(Boolean) as (Conversation & UserConversation)[];
  }
};