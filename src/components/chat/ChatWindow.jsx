import { useState, useEffect } from 'react';
import Message from './Message';
import ChatInput from './ChatInput';
import { api } from '../../api/api';
import './Chat.css';

const ChatWindow = ({ incidentId }) => {
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState('investigating');

  useEffect(() => {
    if (!incidentId) return;

    const syncWithBackend = async () => {
      try {
        const data = await api.fetchHistory(incidentId);
        setMessages(data.history || []);
        setStatus(data.status || 'investigating');
      } catch (err) {
        console.error("Sync error:", err);
      }
    };

    syncWithBackend(); 
    const interval = setInterval(syncWithBackend, 3000);
    return () => clearInterval(interval);
  }, [incidentId]);

  const handleSend = async (text) => {
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    await api.sendMessage(incidentId, text);
  };

  const onRemediate = async () => {
    if (status !== 'investigating') return;

    setStatus('remediating');
    
    const res = await api.remediate(incidentId);
    if (!res.success) {
      alert("Failed to trigger remediation.");
      setStatus('investigating');
    }
  };

  const renderRemediateButton = () => {
    const config = {
      investigating: { label: '🛡️ Take Remedial Action', class: 'btn-active', disabled: false },
      remediating: { label: '⏳ Remediating...', class: 'btn-progress', disabled: true },
      resolved: { label: '✅ Resolved', class: 'btn-resolved', disabled: true }
    };

    const current = config[status] || config.investigating;

    return (
      <button 
        className={`remediate-btn ${current.class}`} 
        onClick={onRemediate}
        disabled={current.disabled}
      >
        {current.label}
      </button>
    );
  };

  if (!incidentId) return <div className="empty-state">Select an incident from the sidebar</div>;

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div className="header-info">
          <span className={`status-indicator ${status}`}></span>
          <h2>Investigation: {incidentId}</h2>
        </div>
        {renderRemediateButton()}
      </div>

      <div className="message-list">
        {messages.map((m, i) => <Message key={i} message={m} />)}
      </div>

      <ChatInput onSend={handleSend} disabled={status === 'resolved'} />
    </div>
  );
};

export default ChatWindow;