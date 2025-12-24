import React from 'react';

const Message = ({ message }) => {
  const isAI = message.role === 'assistant' || message.role === 'system';
  
  return (
    <div className={`message-wrapper ${isAI ? 'ai' : 'user'}`}>
      <div className="message-meta">
        {message.role.toUpperCase()}
      </div>
      <div className="message-bubble">
        {message.content}
      </div>
    </div>
  );
};

export default Message;