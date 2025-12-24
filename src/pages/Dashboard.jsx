import { useState, useEffect } from 'react';
import Header from '../components/layout/Header';
import IncidentList from '../components/incidents/IncidentList';
import ChatWindow from '../components/chat/ChatWindow';
import { api } from '../api/api';

const Dashboard = () => {
  const [incidents, setIncidents] = useState([]);
  const [activeIncidentId, setActiveIncidentId] = useState(null);

  const refreshIncidents = async () => {
    const data = await api.fetchIncidents();
    setIncidents(data);
  };

  useEffect(() => {
    refreshIncidents();
    const int = setInterval(refreshIncidents, 15000); 
    return () => clearInterval(int);
  }, []);

  return (
    <div className="dashboard-layout">
      <Header onSimulate={api.simulateWebhook} />
      <div className="main-content">
        <IncidentList 
          incidents={incidents} 
          activeId={activeIncidentId} 
          onSelect={setActiveIncidentId} 
        />
        <ChatWindow incidentId={activeIncidentId} />
      </div>
    </div>
  );
};

export default Dashboard;