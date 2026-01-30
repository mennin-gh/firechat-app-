import React from 'react';

interface Conversation {
  id: string;
  name: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  type: 'direct' | 'group';
  avatar ? : string;
  participants ? : string[];
}

interface ConversationSidebarProps {
  conversations: Conversation[];
  selectedId: string;
  onSelectConversation: (id: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const ConversationSidebar: React.FC < ConversationSidebarProps > = ({
  conversations,
  selectedId,
  onSelectConversation,
  collapsed,
  onToggleCollapse
}) => {
  if (collapsed) {
    return (
      <div className="sidebar-collapsed">
        <button className="sidebar-toggle" onClick={onToggleCollapse}>
          →
        </button>
        <div className="collapsed-avatars">
          {conversations.slice(0, 3).map(conv => (
            <div 
              key={conv.id}
              className={`collapsed-avatar ${selectedId === conv.id ? 'selected' : ''}`}
              onClick={() => onSelectConversation(conv.id)}
              title={conv.name}
            >
              {conv.avatar ? (
                <img src={conv.avatar} alt={conv.name} />
              ) : (
                <span>{conv.name.charAt(0)}</span>
              )}
              {conv.unreadCount > 0 && (
                <span className="collapsed-unread">{conv.unreadCount}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div className="conversation-sidebar">
      <div className="sidebar-header">
        <h2>Messages</h2>
        <div className="header-actions">
          <button className="new-chat-btn" title="New Conversation">
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
        />
        <span className="search-icon">🔍</span>
      </div>

      <div className="conversation-list">
        {conversations.map(conversation => (
          <div
            key={conversation.id}
            className={`conversation-item ${selectedId === conversation.id ? 'selected' : ''}`}
            onClick={() => onSelectConversation(conversation.id)}
          >
            <div className="conversation-avatar">
              {conversation.avatar ? (
                <img src={conversation.avatar} alt={conversation.name} />
              ) : conversation.type === 'group' ? (
                <span className="group-avatar">👥</span>
              ) : (
                <span className="user-avatar">
                  {conversation.name.charAt(0)}
                </span>
              )}
              {conversation.unreadCount > 0 && (
                <span className="unread-badge">{conversation.unreadCount}</span>
              )}
            </div>
            
            <div className="conversation-details">
              <div className="conversation-header">
                <h3 className="conversation-name">{conversation.name}</h3>
                <span className="conversation-time">{conversation.lastMessageTime}</span>
              </div>
              
              <div className="conversation-preview">
                <p className="preview-text">{conversation.lastMessage}</p>
                {conversation.unreadCount > 0 && (
                  <span className="preview-indicator"></span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="sidebar-footer">
        <div className="user-profile">
          <div className="profile-avatar">
            <span>EM</span>
          </div>
          <div className="profile-info">
            <span className="profile-name">Ennin Martin</span>
            <span className="profile-status online">● Online</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConversationSidebar;