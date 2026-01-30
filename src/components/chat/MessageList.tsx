import React from 'react';
import { Message } from '../../hooks/useRealtimeMessages';
import { auth } from '../../lib/firebase/config';

interface MessageListProps {
  messages: Message[];
  loading: boolean;
  error: string | null;
}

const MessageList: React.FC < MessageListProps > = ({ messages, loading, error }) => {
  const currentUserId = auth.currentUser?.uid;
  
  if (loading) {
    return (
      <div className="message-list loading">
        <div className="loading-spinner"></div>
        <p>Loading messages...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="message-list error">
        <p>⚠️ Error loading messages: {error}</p>
      </div>
    );
  }
  
  if (messages.length === 0) {
    return (
      <div className="message-list empty">
        <div className="empty-icon">💬</div>
        <p>No messages yet. Start the conversation!</p>
      </div>
    );
  }
  
  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  return (
    <div className="message-list">
      {messages.map((message) => {
        const isOwnMessage = message.senderId === currentUserId;
        
        return (
          <div
            key={message.id}
            className={`message ${isOwnMessage ? 'own' : 'other'}`}
          >
            {!isOwnMessage && (
              <div className="message-sender">
                {message.senderPhotoURL && (
                  <img
                    src={message.senderPhotoURL}
                    alt={message.senderName}
                    className="sender-avatar"
                  />
                )}
                <span className="sender-name">{message.senderName}</span>
              </div>
            )}
            
            <div className="message-bubble">
              <p className="message-text">{message.text}</p>
              <div className="message-footer">
                <span className="message-time">
                  {formatTime(message.timestamp)}
                </span>
                {isOwnMessage && (
                  <span className="message-status">{message.status}</span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MessageList;