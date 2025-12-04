import { useEffect } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Navbar from '../components/Navbar';
import './Map.css';

const mockReports = [
  {
    id: "CIV-1001",
    type: "Pothole",
    description: "Large pothole near main street affecting traffic.",
    date: "2025-10-18",
    submittedBy: "User123",
    location: [28.6139, 77.2090], // Delhi coordinates
    status: "In Progress",
    images: ["https://via.placeholder.com/100"]
  },
  {
    id: "CIV-1002",
    type: "Garbage",
    description: "Overflowing garbage bins near park area.",
    date: "2025-10-17",
    submittedBy: "User456",
    location: [28.6145, 77.2020],
    status: "Resolved",
    images: ["https://via.placeholder.com/100"]
  },
  {
    id: "CIV-1003",
    type: "Streetlight",
    description: "Broken streetlight on 5th Avenue.",
    date: "2025-10-16",
    submittedBy: "User789",
    location: [28.6120, 77.2150],
    status: "Pending",
    images: ["https://via.placeholder.com/100"]
  }
];

// Custom icon colors based on issue type
const getIcon = (type) => {
  const iconUrl = {
    Pothole: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
    Garbage: "https://cdn-icons-png.flaticon.com/512/616/616408.png",
    Streetlight: "https://cdn-icons-png.flaticon.com/512/2910/2910761.png",
    Water: "https://cdn-icons-png.flaticon.com/512/728/728093.png",
    Drainage: "https://cdn-icons-png.flaticon.com/512/1284/1284607.png",
    Other: "https://cdn-icons-png.flaticon.com/512/565/565547.png"
  }[type] || "https://cdn-icons-png.flaticon.com/512/565/565547.png";

  return L.icon({
    iconUrl,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30]
  });
};

function MapPage() {
  useEffect(() => {
    const map = L.map("city-map").setView([28.6139, 77.2090], 13);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
    }).addTo(map);

    mockReports.forEach((report) => {
      const marker = L.marker(report.location, { icon: getIcon(report.type) }).addTo(map);
      const popupContent = `
        <div style="max-width:250px">
          <h3 style="color:#00796b">${report.type}</h3>
          <p><strong>Date:</strong> ${report.date}</p>
          <p><strong>Status:</strong> ${report.status}</p>
          <p><strong>Submitted By:</strong> ${report.submittedBy}</p>
          <p>${report.description}</p>
          ${report.images.map(img => `<img src="${img}" style="width:100%; margin-top:5px; border-radius:5px;">`).join("")}
        </div>
      `;
      marker.bindPopup(popupContent);
    });

    return () => map.remove(); // cleanup on unmount
  }, []);

  return (
    <>
      <Navbar />
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
