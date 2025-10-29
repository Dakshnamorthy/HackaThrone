import { useEffect, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Navbar from '../components/Navbar';
import GovNavbar from '../components/GovNavbar';
import { useAuth } from '../context/SimpleAuthContext';
import { supabase } from '../../supabaseClient';
import './Map.css';



// Custom icon colors based on issue status and priority
const getIcon = (status, priority) => {
  let iconUrl;
  
  // Choose icon color based on status
  if (status === 'Closed') {
    iconUrl = "https://cdn-icons-png.flaticon.com/512/2776/2776067.png"; // green pin for closed
  } else if (status === 'Resolved') {
    iconUrl = "https://cdn-icons-png.flaticon.com/512/2776/2776043.png"; // purple pin for waiting for closure
  } else if (status === 'In Progress') {
    iconUrl = "https://cdn-icons-png.flaticon.com/512/684/684908.png"; // orange/red pin
  } else if (priority === 'High') {
    iconUrl = "https://cdn-icons-png.flaticon.com/512/684/684908.png"; // red pin for high priority
  } else {
    iconUrl = "https://cdn-icons-png.flaticon.com/512/2776/2776067.png"; // default blue/green pin
  }
  
  return L.icon({
    iconUrl: iconUrl,
    iconSize: [35, 35],
    iconAnchor: [17, 35],
    popupAnchor: [0, -30]
  });
};


function MapPage() {
  const { userRole } = useAuth();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch issues from database
  const fetchIssues = async () => {
    try {
      const { data, error } = await supabase
        .from('issues')
        .select(`
          id,
          issue_id,
          citizen_id,
          type,
          description,
          location,
          latitude,
          longitude,
          status,
          priority,
          images,
          created_at,
          updated_at,
          citizens (name, email)
        `)
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .neq('status', 'Closed'); // Exclude closed issues

      if (error) throw error;
      
      // Filter out issues with invalid coordinates
      const validIssues = (data || []).filter(issue => 
        issue.latitude && issue.longitude && 
        !isNaN(parseFloat(issue.latitude)) && 
        !isNaN(parseFloat(issue.longitude))
      );
      
      setIssues(validIssues);
    } catch (error) {
      console.error('Error fetching issues:', error);
      // Set empty array if database fails
      setIssues([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, []);

  useEffect(() => {
    if (loading) return;
    
    const map = L.map("city-map");

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
    }).addTo(map);

    const markers = [];

    issues.forEach((issue) => {
      const marker = L.marker([parseFloat(issue.latitude), parseFloat(issue.longitude)], { 
        icon: getIcon(issue.status, issue.priority) 
      }).addTo(map);

      const statusColor = issue.status === 'Resolved' ? '#9c27b0' : // Purple for waiting for closure
                         issue.status === 'In Progress' ? '#ff9800' : 
                         issue.status === 'Closed' ? '#4caf50' : '#f44336';

      const statusDisplay = issue.status === 'Resolved' ? 'Waiting for Closure' : issue.status;
      const formattedDate = new Date(issue.created_at).toLocaleDateString();

      marker.bindPopup(`
        <div style="font-family: Arial, sans-serif; width: 200px;">
          <h3 style="margin: 0 0 8px 0; color: #d32f2f; font-size: 16px;">${issue.type}</h3>
          <p style="margin: 4px 0; font-size: 14px; color: #333;"><strong>ID:</strong> ${issue.issue_id}</p>
          <p style="margin: 4px 0; font-size: 14px; color: #333;"><strong>Status:</strong> 
            <span style="color: ${statusColor};">
              ${statusDisplay}
            </span>
          </p>
          <p style="margin: 4px 0; font-size: 14px; color: #333;"><strong>Priority:</strong> ${issue.priority}</p>
          <p style="margin: 4px 0; font-size: 14px; color: #333;"><strong>Date:</strong> ${formattedDate}</p>
          <p style="margin: 4px 0; font-size: 14px; color: #666;">${issue.description}</p>
          <p style="margin: 4px 0; font-size: 12px; color: #888;"><strong>Reported by:</strong> ${issue.citizens?.name || 'Anonymous'}</p>
          <p style="margin: 4px 0; font-size: 12px; color: #888;"><strong>Location:</strong> ${issue.location || 'Not specified'}</p>
          ${issue.images && Array.isArray(issue.images) && issue.images.length > 0 ? 
            `<img src="${issue.images[0]}" style="width: 100%; max-width: 180px; height: auto; margin-top: 8px; border-radius: 4px;" alt="Issue image" onerror="this.style.display='none'" />` 
            : ''
          }
        </div>
      `);

      markers.push(marker);
    });

    // Fit map to markers if any exist
    if (markers.length > 0) {
      const group = L.featureGroup(markers);
      map.fitBounds(group.getBounds().pad(0.2));
    } else {
      // Default view if no markers
      map.setView([11.9416, 79.8083], 13); // Pondicherry coordinates
    }

    return () => map.remove();
  }, [loading, issues]);

  return (
    <>
      {userRole === 'government' ? <GovNavbar /> : <Navbar />}
      <div className="map-container">
        <h1>City Issues Map</h1>
        <p className="map-intro">Explore all reported civic issues in your city. Click markers to see details.</p>
        {loading ? (
          <div className="map-loading">
            <p>Loading map data...</p>
          </div>
        ) : (
          <div id="city-map"></div>
        )}
        {!loading && (
          <div className="map-legend">
            <h3>Map Legend</h3>
            <div className="legend-items">
              <div className="legend-item">
                <img src="https://cdn-icons-png.flaticon.com/512/684/684908.png" alt="Pending/In Progress" style={{width: '20px', height: '20px'}} />
                <span>Pending / In Progress</span>
              </div>
              <div className="legend-item">
                <img src="https://cdn-icons-png.flaticon.com/512/2776/2776043.png" alt="Waiting for Closure" style={{width: '20px', height: '20px'}} />
                <span>Waiting for Closure</span>
              </div>
              <div className="legend-item">
                <img src="https://cdn-icons-png.flaticon.com/512/2776/2776067.png" alt="Default" style={{width: '20px', height: '20px'}} />
                <span>Low Priority</span>
              </div>
            </div>
            <p className="issues-count">Showing {issues.length} active issues</p>
          </div>
        )}
        {!loading && issues.length === 0 && (
          <div className="no-issues-message">
            <p>No active issues with location data found.</p>
            <p>Issues will appear here once they are reported with GPS coordinates.</p>
          </div>
        )}
      </div>

      <footer className="footer">
        <p>© 2025 CivicApp. All Rights Reserved.</p>
        <div className="footer-links">
          <a href="#">About</a> | <a href="#">Contact</a> | <a href="#">Privacy Policy</a> | <a href="#">Terms</a>
        </div>
      </footer>
    </>
  );
}

export default MapPage;
