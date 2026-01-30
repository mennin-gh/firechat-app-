import React, { useState } from 'react';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { useRealtimeMessages } from '../../hooks/useRealtimeMessages';
import { auth } from '../../lib/firebase/config';

interface ChatRoomProps {
  conversationId: string;
  onBackToConversations: () => void;
}

const ChatRoom: React.FC < ChatRoomProps > = ({ conversationId, onBackToConversations }) => {
  const { messages, loading, error, sendMessage } = useRealtimeMessages(conversationId);
  const [isCallActive, setIsCallActive] = useState(false);
  
  const handleSendMessage = async (text: string) => {
    const user = auth.currentUser;
    if (!user) return;
    
    try {
      await sendMessage(
        text,
        user.uid,
        user.displayName || 'User',
        user.photoURL || undefined
      );
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };
  
  const handleStartCall = (type: 'audio' | 'video') => {
    setIsCallActive(true);
    // Call logic will be implemented in Phase 4
    alert(`${type.charAt(0).toUpperCase() + type.slice(1)} call starting...`);
  };
  
  return (
    <div className="chat-room">
      {/* Chat Header */}
      <div className="chat-room-header">
        <button 
          className="back-button"
          onClick={onBackToConversations}
          aria-label="Back to conversations"
        >
          ←
        </button>
        
        <div className="header-info">
          <div className="chat-partner">
            <div className="partner-avatar">
              <span>👥</span>
            </div>
            <div className="partner-details">
              <h2>Tech Team</h2>
              <p className="partner-status">
                <span className="status-dot online"></span>
                3 members online
              </p>
            </div>
          </div>
        </div>

        <div className="header-actions">
          <button 
            className="call-button audio"
            onClick={() => handleStartCall('audio')}
            title="Voice call"
          >
            📞
          </button>
          <button 
            className="call-button video"
            onClick={() => handleStartCall('video')}
            title="Video call"
          >
            📹
          </button>
          <button className="menu-button" title="More options">
            ⋮
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="messages-container">
        <MessageList 
          messages={messages}
          loading={loading}
          error={error}
        />
      </div>

      {/* Message Input */}
      <div className="chat-input-container">
        <MessageInput 
          onSendMessage={handleSendMessage}
          disabled={loading}
        />
      </div>

      {/* Call Interface (Hidden by default) */}
      {isCallActive && (
        <div className="call-interface">
          <div className="call-header">
            <h3>Ongoing Call</h3>
            <button 
              className="end-call-btn"
              onClick={() => setIsCallActive(false)}
            >
              End Call
            </button>
          </div>
          <div className="call-participants">
            {/* Call interface will be implemented in Phase 4 */}
            <p>Call interface coming soon...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatRoom;