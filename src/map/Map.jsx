import { useEffect, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Navbar from '../components/Navbar';
import GovNavbar from '../components/GovNavbar';
import { useAuth } from '../context/SimpleAuthContext';
import { supabase } from '../../supabaseClient';
import './Map.css';

const mockReports = [
  {
    id: "CIV-1001",
    type: "Pothole",
    description: "Large pothole near Mission Street causing traffic slowdown.",
    date: "2025-10-18",
    submittedBy: "User123",
    location: [11.9405, 79.8281], // Mission Street
    status: "In Progress",
    images: ["https://via.placeholder.com/100"]
  },
  { 
    id: "CIV-1002",
    type: "Garbage",
    description: "Overflowing garbage bins near Rock Beach.",
    date: "2025-10-17",
    submittedBy: "User456",
    location: [11.9360, 79.8350], // Rock Beach / White Town
    status: "Resolved",
    images: ["https://via.placeholder.com/100"]
  },
  {
    id: "CIV-1003",
    type: "Streetlight",
    description: "Broken streetlight near Pondicherry University entrance.",
    date: "2025-10-16",
    submittedBy: "User789",
    location: [12.0205, 79.8560], // Pondicherry University
    status: "Pending",
    images: ["https://via.placeholder.com/100"]
  }
];


// Custom icon colors based on issue type
const getIcon = () =>
  L.icon({
    iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png", // red map pin
    iconSize: [35, 35],
    iconAnchor: [17, 35],
    popupAnchor: [0, -30]
  });


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
          *,
          citizens (name)
        `)
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

      if (error) throw error;
      setIssues(data || []);
    } catch (error) {
      console.error('Error fetching issues:', error);
      // Fallback to mock data if database fails
      setIssues(mockReports.map(report => ({
        ...report,
        latitude: report.location[0],
        longitude: report.location[1],
        citizens: { name: report.submittedBy }
      })));
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
      const marker = L.marker([issue.latitude, issue.longitude], { icon: getIcon() }).addTo(map);

      const statusColor = issue.status === 'Resolved' ? '#4caf50' : 
                         issue.status === 'In Progress' ? '#ff9800' : '#f44336';

      const formattedDate = new Date(issue.created_at).toLocaleDateString();

      marker.bindPopup(`
        <div style="font-family: Arial, sans-serif; width: 200px;">
          <h3 style="margin: 0 0 8px 0; color: #d32f2f; font-size: 16px;">${issue.type}</h3>
          <p style="margin: 4px 0; font-size: 14px; color: #333;"><strong>ID:</strong> ${issue.issue_id}</p>
          <p style="margin: 4px 0; font-size: 14px; color: #333;"><strong>Status:</strong> 
            <span style="color: ${statusColor};">
              ${issue.status}
            </span>
          </p>
          <p style="margin: 4px 0; font-size: 14px; color: #333;"><strong>Priority:</strong> ${issue.priority}</p>
          <p style="margin: 4px 0; font-size: 14px; color: #333;"><strong>Date:</strong> ${formattedDate}</p>
          <p style="margin: 4px 0; font-size: 14px; color: #666;">${issue.description}</p>
          <p style="margin: 4px 0; font-size: 12px; color: #888;"><strong>Reported by:</strong> ${issue.citizens?.name || 'Anonymous'}</p>
          ${issue.images && issue.images.length > 0 ? 
            `<img src="${issue.images[0]}" style="width: 100%; max-width: 180px; height: auto; margin-top: 8px; border-radius: 4px;" alt="Issue image" />` 
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
        <div id="city-map"></div>
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
