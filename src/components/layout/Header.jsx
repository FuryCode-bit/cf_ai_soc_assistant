import React from 'react';
import './Header.css';

const Header = ({ onSimulate }) => {
  return (
    <header className="siem-header">
      <div className="header-left">
        <div className="siem-logo">SOC</div>
        <h1>L1 Assistant</h1>
      </div>
      <div className="header-actions">
        <button className="simulate-btn" onClick={onSimulate}>
          + Simulate SIEM Alert
        </button>
      </div>
    </header>
  );
};

export default Header;