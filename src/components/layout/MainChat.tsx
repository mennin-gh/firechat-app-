import React, { useState } from 'react';
import RealConversationSidebar from './RealConversationSidebar';
import ChatRoom from '../chat/ChatRoom';
import './MainChat.css';

interface MainChatProps {
  onNewConversation: () => void;
}

const MainChat: React.FC < MainChatProps > = ({ onNewConversation }) => {
  const [selectedConversation, setSelectedConversation] = useState < string > ('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  const handleSelectConversation = (id: string) => {
    setSelectedConversation(id);
  };
  
  const handleToggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };
  
  return (
    <div className="main-chat-container">
      <div className={`chat-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <RealConversationSidebar
          selectedId={selectedConversation}
          onSelectConversation={handleSelectConversation}
          collapsed={sidebarCollapsed}
          onToggleCollapse={handleToggleSidebar}
          onNewConversation={onNewConversation}
          // REMOVED: conversations prop - RealConversationSidebar fetches its own data
        />
      </div>
      
      <div className="chat-main">
        <ChatRoom 
          conversationId={selectedConversation}
          onBackToConversations={() => setSelectedConversation('')}
        />
      </div>
    </div>
  );
};

export default MainChat;