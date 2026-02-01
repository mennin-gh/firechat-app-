import React, { useState } from 'react';
import RealConversationSidebar from './RealConversationSidebar';
import ChatRoom from '../chat/ChatRoom';

// Mock data for development
const mockConversations = [
  {
    id: '1',
    name: 'Tech Team',
    lastMessage: 'Let\'s meet at 3 PM tomorrow',
    lastMessageTime: '2:30 PM',
    unreadCount: 2,
    type: 'group' as const,
    participants: ['user1', 'user2', 'user3']
  },
  {
    id: '2',
    name: 'Alex Johnson',
    lastMessage: 'Thanks for the help!',
    lastMessageTime: '11:45 AM',
    unreadCount: 0,
    type: 'direct' as const,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex'
  },
  {
    id: '3',
    name: 'Design Crew',
    lastMessage: 'New mockups are ready',
    lastMessageTime: 'Yesterday',
    unreadCount: 5,
    type: 'group' as const,
    participants: ['user4', 'user5', 'user6']
  }
];

const MainChat: React.FC = () => {
  const [selectedConversation, setSelectedConversation] = useState<string>('1');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleSelectConversation = (id: string) => {
    setSelectedConversation(id);
  };

  return (
    <div className="main-chat-container">
      <div className={`chat-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <RealConversationSidebar
          conversations={mockConversations}
          selectedId={selectedConversation}
          onSelectConversation={handleSelectConversation}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
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