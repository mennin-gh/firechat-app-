import React, { useState, useEffect } from 'react';
import { auth } from '../../lib/firebase/config';
import { conversationService } from '../../lib/firebase/conversations';
import { userService } from '../../lib/firebase/users';
import { Conversation, UserConversation } from '../../lib/firebase/conversations';
import { UserProfile } from '../../lib/firebase/users';

interface RealConversationSidebarProps {
  selectedId: string;
  onSelectConversation: (id: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onNewConversation: () => void;
}

const RealConversationSidebar: React.FC<RealConversationSidebarProps> = ({
  selectedId,
  onSelectConversation,
  collapsed,
  onToggleCollapse,
  onNewConversation
}) => {
  const [conversations, setConversations] = useState<(Conversation & UserConversation)[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredConversations, setFilteredConversations] = useState<(Conversation & UserConversation)[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  // Load conversations on component mount
  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const loadData = async () => {
      try {
        setLoading(true);
        
        // Get current user profile
        const user = await userService.getUser(userId);
        setCurrentUser(user);
        
        // Set up real-time listener for conversations
        const unsubscribe = conversationService.onUserConversationsChange(
          userId,
          (conversations) => {
            setConversations(conversations);
            setFilteredConversations(conversations);
            setLoading(false);
            setError(null);
          }
        );
        
        return unsubscribe;
      } catch (err: any) {
        setError(err.message || 'Failed to load conversations');
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Filter conversations based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredConversations(conversations);
      return;
    }

    const filtered = conversations.filter(conv => {
      const searchLower = searchTerm.toLowerCase();
      
      // Search in conversation name
      if (conv.name?.toLowerCase().includes(searchLower)) return true;
      
      // Search in last message text
      if (conv.lastMessage?.text.toLowerCase().includes(searchLower)) return true;
      
      // For direct conversations, we could search participant names
      // (This would require fetching user profiles)
      
      return false;
    });
    
    setFilteredConversations(filtered);
  }, [searchTerm, conversations]);

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    
    try {
      const date = timestamp.toDate();
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      
      if (diffHours < 24) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else if (diffHours < 48) {
        return 'Yesterday';
      } else {
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
      }
    } catch {
      return '';
    }
  };

  const getConversationDisplayName = (conversation: Conversation & UserConversation): string => {
    if (conversation.name) return conversation.name;
    
    if (conversation.type === 'direct' && conversation.participants.length === 2) {
      const otherUserId = conversation.participants.find(id => id !== auth.currentUser?.uid);
      return otherUserId ? `User ${otherUserId.substring(0, 6)}...` : 'Direct Chat';
    }
    
    return `${conversation.type === 'group' ? 'Group' : 'Chat'} ${conversation.id.substring(0, 8)}`;
  };

  if (collapsed) {
    return (
      <div className="sidebar-collapsed">
        <button className="sidebar-toggle" onClick={onToggleCollapse}>
          →
        </button>
        <div className="collapsed-avatars">
          {filteredConversations.slice(0, 5).map(conv => (
            <div 
              key={conv.id}
              className={`collapsed-avatar ${selectedId === conv.id ? 'selected' : ''}`}
              onClick={() => onSelectConversation(conv.id)}
              title={getConversationDisplayName(conv)}
            >
              <span>{getConversationDisplayName(conv).charAt(0)}</span>
              {conv.unreadCount > 0 && (
                <span className="collapsed-unread">
                  {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="conversation-sidebar loading">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <p>Loading conversations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="conversation-sidebar error">
        <div className="error-content">
          <p className="error-icon">⚠️</p>
          <p>Error loading conversations</p>
          <p className="error-detail">{error}</p>
          <button className="retry-btn" onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="conversation-sidebar">
      <div className="sidebar-header">
        <h2>Messages</h2>
        <div className="header-actions">
          <button 
            className="new-chat-btn" 
            onClick={onNewConversation}
            title="New Conversation"
          >
            <span className="plus-icon">+</span>
          </button>
          <button className="sidebar-toggle" onClick={onToggleCollapse}>
            ←
          </button>
        </div>
      </div>

      <div className="search-box">
        <input 
          type="text" 
          placeholder="Search conversations..." 
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <span className="search-icon">🔍</span>
        {searchTerm && (
          <button 
            className="clear-search"
            onClick={() => setSearchTerm('')}
            title="Clear search"
          >
            ×
          </button>
        )}
      </div>

      <div className="conversation-list">
        {filteredConversations.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">💬</div>
            <p className="empty-title">No conversations yet</p>
            <p className="empty-subtitle">
              {searchTerm ? 'No results found' : 'Start a new conversation to begin'}
            </p>
            {!searchTerm && (
              <button 
                className="empty-action-btn"
                onClick={onNewConversation}
              >
                Start Chatting
              </button>
            )}
          </div>
        ) : (
          filteredConversations.map(conversation => (
            <div
              key={conversation.id}
              className={`conversation-item ${selectedId === conversation.id ? 'selected' : ''} ${conversation.muted ? 'muted' : ''}`}
              onClick={() => onSelectConversation(conversation.id)}
            >
              <div className="conversation-avatar">
                {conversation.type === 'group' ? (
                  <span className="group-avatar">👥</span>
                ) : (
                  <span className="user-avatar">
                    {getConversationDisplayName(conversation).charAt(0)}
                  </span>
                )}
                {conversation.unreadCount > 0 && !conversation.muted && (
                  <span className="unread-badge">
                    {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                  </span>
                )}
                {conversation.muted && (
                  <span className="muted-badge" title="Muted">🔇</span>
                )}
              </div>
              
              <div className="conversation-details">
                <div className="conversation-header">
                  <h3 className="conversation-name">
                    {getConversationDisplayName(conversation)}
                    {conversation.type === 'group' && (
                      <span className="conversation-type">Group</span>
                    )}
                  </h3>
                  <span className="conversation-time">
                    {formatTime(conversation.lastMessage?.timestamp || conversation.updatedAt)}
                  </span>
                </div>
                
                <div className="conversation-preview">
                  <p className="preview-text">
                    {conversation.lastMessage 
                      ? conversation.lastMessage.text.length > 30
                        ? `${conversation.lastMessage.text.substring(0, 30)}...`
                        : conversation.lastMessage.text
                      : 'No messages yet'
                    }
                  </p>
                  {conversation.unreadCount > 0 && !conversation.muted && (
                    <span className="preview-indicator"></span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="sidebar-footer">
        <div className="user-profile">
          <div className="profile-avatar">
            {currentUser?.photoURL ? (
              <img src={currentUser.photoURL} alt={currentUser.displayName} />
            ) : (
              <span>{currentUser?.displayName?.charAt(0) || 'U'}</span>
            )}
          </div>
          <div className="profile-info">
            <span className="profile-name">
              {currentUser?.displayName || 'User'}
            </span>
            <span className={`profile-status ${currentUser?.status || 'offline'}`}>
              ● {currentUser?.status === 'online' ? 'Online' : 
                 currentUser?.status === 'away' ? 'Away' : 'Offline'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealConversationSidebar;