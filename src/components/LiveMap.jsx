import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

import L from 'leaflet';

const API_URL = 'http://localhost:3000/api';

// ✅ Fix marker icons on all machines
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// 🎨 Color by severity
const getSeverityColor = (severity) => {
    if (severity === 'high') return '#e53e3e';   // 🔴 Red
    if (severity === 'medium') return '#dd6b20'; // 🟠 Orange
    return '#38a169';                            // 🟢 Green
};

const createColoredIcon = (severity) =>
    L.divIcon({
        className: '',
        html: `<div style="
      background-color: ${getSeverityColor(severity)};
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 0 8px rgba(0,0,0,0.4);
    "></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
    });

// 📍 Auto-center map to user's location
const AutoCenter = ({ userLocation }) => {
    const map = useMap();
    useEffect(() => {
        if (userLocation) map.setView(userLocation, 13);
    }, [userLocation, map]);
    return null;
};

const LiveMap = () => {
    const [issues, setIssues] = useState([]);
    const [userLocation, setUserLocation] = useState([20.5937, 78.9629]); // Default: India center
    const [loading, setLoading] = useState(true);

    // 📡 Fetch global complaints from backend
    const fetchGlobalComplaints = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/complaints`);
            const data = await response.json();
            
            if (response.ok) {
                // Map backend fields to the map format
                const globalIssues = data.data
                    .filter(c => c.latitude && c.longitude)
                    .map(c => ({
                        id: c.complaint_id,
                        title: c.issue_type,
                        description: c.description,
                        area: c.area,
                        city: c.city,
                        severity: c.severity,
                        status: c.status,
                        imageUrl: c.image_url,
                        position: [c.latitude, c.longitude],
                        submittedAt: c.created_at
                    }));
                setIssues(globalIssues);
            }
        } catch (error) {
            console.error('Failed to fetch global complaints:', error);
            // Fallback: Use local reports if backend fails
            const stored = JSON.parse(localStorage.getItem('civicfix_issues') || '[]');
            setIssues(stored);
        } finally {
            setLoading(false);
        }
    };

    // 📍 Get user's GPS location and fetch complaints
    useEffect(() => {
        navigator.geolocation.getCurrentPosition(
            (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
            () => console.log('Location access denied, using default.')
        );
        fetchGlobalComplaints();
    }, []);

    return (
        <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ margin: 0 }}>Live Map</h2>
                <button 
                    onClick={fetchGlobalComplaints} 
                    style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid #ddd', background: '#fff', cursor: 'pointer', fontSize: '13px' }}
                >
                    {loading ? 'Refreshing...' : '🔄 Refresh Map'}
                </button>
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '14px', fontSize: '13px', fontWeight: '500' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#e53e3e' }}></div> High
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#dd6b20' }}></div> Medium
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#38a169' }}></div> Low
                </span>
            </div>

            <MapContainer center={userLocation} zoom={13} style={{ height: '550px', width: '100%', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution="© OpenStreetMap contributors"
                />
                <AutoCenter userLocation={userLocation} />

                {issues.map((issue) => (
                    <Marker key={issue.id} position={issue.position} icon={createColoredIcon(issue.severity)}>
                        <Popup>
                            <div style={{ minWidth: '180px' }}>
                                <strong style={{ fontSize: '14px' }}>{issue.title}</strong>
                                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                                    📍 {issue.area}, {issue.city}<br />
                                    🕐 {new Date(issue.submittedAt).toLocaleDateString()}
                                </div>
                                <p style={{ fontSize: '13px', margin: '8px 0', lineHeigh: '1.4' }}>{issue.description}</p>
                                
                                {issue.imageUrl && (
                                    <div style={{ marginTop: '8px', marginBottom: '8px' }}>
                                        <img 
                                            src={`http://localhost:3000${issue.imageUrl}`} 
                                            alt="Issue proof" 
                                            style={{ width: '100%', borderRadius: '4px', height: '100px', objectFit: 'cover', border: '1px solid #eee' }}
                                        />
                                    </div>
                                )}

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #eee' }}>
                                    <span style={{ padding: '2px 8px', borderRadius: '4px', background: '#f1f5f9', fontSize: '11px', fontWeight: 'bold' }}>
                                        {issue.status}
                                    </span>
                                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>#{issue.id}</span>
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
};

export default LiveMap;