import React, { useState, useRef } from 'react';

interface MessageInputProps {
  onSendMessage: (text: string) => Promise < void > ;
  disabled ? : boolean;
}

const MessageInput: React.FC < MessageInputProps > = ({ onSendMessage, disabled = false }) => {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const textareaRef = useRef < HTMLTextAreaElement > (null);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedMessage = message.trim();
    if (!trimmedMessage || sending || disabled) return;
    
    setSending(true);
    try {
      await onSendMessage(trimmedMessage);
      setMessage('');
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };
  
  const handleInput = (e: React.ChangeEvent < HTMLTextAreaElement > ) => {
    setMessage(e.target.value);
    
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };
  
  return (
    <form className="message-input-container" onSubmit={handleSubmit}>
      <div className="message-input-wrapper">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Type your message here..."
          disabled={disabled || sending}
          className="message-textarea"
          rows={1}
        />
        
        <div className="input-actions">
          <button
            type="button"
            className="input-action-btn"
            title="Attach file"
            disabled={disabled || sending}
          >
            📎
          </button>
          
          <button
            type="button"
            className="input-action-btn"
            title="Send voice message"
            disabled={disabled || sending}
          >
            🎤
          </button>
          
          <button
            type="submit"
            className="send-button"
            disabled={!message.trim() || disabled || sending}
            title="Send message"
          >
            {sending ? (
              <div className="send-spinner"></div>
            ) : (
              '🚀'
            )}
          </button>
        </div>
      </div>
      
      <div className="input-hints">
        <span>Press Enter to send • Shift+Enter for new line</span>
      </div>
    </form>
  );
};

export default MessageInput;