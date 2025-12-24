import React, { useState } from 'react';

const ChatInput = ({ onSend }) => {
  const [text, setText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSend(text);
    setText('');
  };

  return (
    <form className="chat-input-area" onSubmit={handleSubmit}>
      <input 
        type="text" 
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Ask for investigation steps..."
      />
      <button type="submit">Send</button>
    </form>
  );
};

export default ChatInput;