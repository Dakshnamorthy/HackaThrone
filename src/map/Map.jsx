import { useEffect } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Navbar from '../components/Navbar';
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
  useEffect(() => {
  const map = L.map("city-map");

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
  }).addTo(map);

  const markers = [];

  mockReports.forEach((report) => {
    const marker = L.marker(report.location, { icon: getIcon(report.type) }).addTo(map);
    const popupContent = `
      <div style="max-width:250px">
        <h3 style="color:#00796b">${report.type}</h3>
        <p><strong>Date:</strong> ${report.date}</p>
        <p><strong>Status:</strong> ${report.status}</p>
        <p><strong>Submitted By:</strong> ${report.submittedBy}</p>
        <p>${report.description}</p>
        ${report.images
          .map(
            (img) =>
              `<img src="${img}" style="width:100%; margin-top:5px; border-radius:5px;">`
          )
          .join("")}
      </div>
    `;
    marker.bindPopup(popupContent);
    markers.push(marker);
  });

  // 🔥 Automatically fit the map to all markers
  const group = L.featureGroup(markers);
  map.fitBounds(group.getBounds().pad(0.2)); // add small padding

  return () => map.remove();
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
