import {
  collection,
  doc,
  setDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
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
  // Create a direct conversation between two users
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
  
  // Create a group conversation
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
  
  // Get user's conversations
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
      
      callback(conversations.filter(Boolean) as (Conversation & UserConversation)[]);
    });
  },
  
  // Update user conversation settings
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
  },

  // === NEW: Remove participant from group (uses arrayRemove) ===
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
        
        // Archive the user's conversation instead of deleting
        const userConvRef = doc(db, 'users', userId, 'conversations', conversationId);
        await updateDoc(userConvRef, {
          archived: true,
          updatedAt: serverTimestamp()
        });
      }
    }
  },

  // === NEW: Search conversations by name/description (uses where and limit) ===
  async searchConversations(userId: string, searchTerm: string, maxResults: number = 10): Promise<(Conversation & UserConversation)[]> {
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
          
          // Filter by search term in name or description
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

  // === NEW: Get only group conversations (uses where for filtering) ===
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

  // === NEW: Get recent conversations with limit (uses limit) ===
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
  },

  // === NEW: Search for conversations where user is a participant (uses where) ===
  async findConversationWithUser(currentUserId: string, otherUserId: string): Promise<string | null> {
    const userConvsRef = collection(db, 'users', currentUserId, 'conversations');
    const snapshot = await getDocs(userConvsRef);
    
    for (const userConvDoc of snapshot.docs) {
      const userConv = userConvDoc.data() as UserConversation;
      const convRef = doc(db, 'conversations', userConv.conversationId);
      const convDoc = await getDoc(convRef);
      
      if (convDoc.exists()) {
        const conversation = convDoc.data() as Conversation;
        if (conversation.type === 'direct' && conversation.participants.includes(otherUserId)) {
          return conversation.id;
        }
      }
    }
    
    return null;
  }
};