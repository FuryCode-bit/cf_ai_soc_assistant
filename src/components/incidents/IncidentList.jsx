import './Incident.css';

const IncidentList = ({ incidents, activeId, onSelect }) => {
  return (
    <div className="incident-sidebar">
      <div className="sidebar-header">Active Security Incidents</div>
      {incidents.map(inc => (
        <div 
          key={inc.id} 
          className={`incident-item ${activeId === inc.id ? 'active' : ''} ${inc.severity}`}
          onClick={() => onSelect(inc.id)}
        >
          <div className="severity-indicator"></div>
          <div className="incident-info">
            <span className="incident-title">{inc.rule || 'Unknown Alert'}</span>
            <span className="incident-meta"> - {inc.timestamp}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default IncidentList;