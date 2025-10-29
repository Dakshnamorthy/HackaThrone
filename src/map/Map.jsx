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
      console.log('🔍 Attempting to fetch issues from database...');
      
      // Check authentication status
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      console.log('👤 Current user:', user);
      if (authError) {
        console.warn('⚠️ Auth error:', authError);
      }
      
      // First, try a simple query to test connection
      const { data, error } = await supabase
        .from('issues')
        .select('*')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

      if (error) throw error;
      
      console.log('Raw data from database:', data);
      console.log('Number of issues fetched:', data?.length || 0);
      console.log('Sample issue data:', data?.[0]);
      
      // Check if we have any data at all
      if (!data || data.length === 0) {
        console.warn('❌ No issues found in database');
        setIssues([]);
        return;
      }
      
      // Log coordinate data for each issue
      data.forEach((issue, index) => {
        console.log(`Issue ${index + 1} (${issue.issue_id}):`, {
          latitude: issue.latitude,
          longitude: issue.longitude,
          latType: typeof issue.latitude,
          lngType: typeof issue.longitude,
          location: issue.location,
          status: issue.status
        });
      });
      
      // Filter and validate coordinates
      const validIssues = (data || []).filter(issue => {
        const lat = parseFloat(issue.latitude);
        const lng = parseFloat(issue.longitude);
        
        // Check if coordinates are valid numbers and within reasonable bounds
        const isValidLat = !isNaN(lat) && lat >= -90 && lat <= 90;
        const isValidLng = !isNaN(lng) && lng >= -180 && lng <= 180;
        
        if (!isValidLat || !isValidLng) {
          console.warn(`Invalid coordinates for issue ${issue.issue_id}:`, {
            latitude: issue.latitude,
            longitude: issue.longitude,
            parsedLat: lat,
            parsedLng: lng
          });
          return false;
        }
        
        return true;
      }).map(issue => {
        let lat = parseFloat(issue.latitude);
        let lng = parseFloat(issue.longitude);
        
        // Auto-fix swapped coordinates if detected
        // If latitude is > 90 or < -90, coordinates are definitely swapped
        if (lat > 90 || lat < -90) {
          console.warn(`Auto-fixing swapped coordinates for issue ${issue.issue_id}`);
          [lat, lng] = [lng, lat]; // Swap them
        }
        
        // If coordinates seem to be outside reasonable bounds for your region,
        // but would make sense if swapped, auto-fix them
        const isLatOutOfBounds = lat < 6 || lat > 37;
        const isLngOutOfBounds = lng < 68 || lng > 97;
        const wouldBeValidIfSwapped = (lng >= 6 && lng <= 37) && (lat >= 68 && lat <= 97);
        
        if (isLatOutOfBounds && isLngOutOfBounds && wouldBeValidIfSwapped) {
          console.warn(`Auto-fixing likely swapped coordinates for issue ${issue.issue_id}`);
          [lat, lng] = [lng, lat]; // Swap them
        }
        
        return {
          ...issue,
          latitude: lat,
          longitude: lng
        };
      });
      
      console.log(`Found ${validIssues.length} issues with valid coordinates:`, 
        validIssues.map(issue => ({
          id: issue.issue_id,
          lat: issue.latitude,
          lng: issue.longitude,
          location: issue.location,
          // Check if coordinates are in reasonable range for India (rough bounds)
          inIndia: (issue.latitude >= 6 && issue.latitude <= 37 && 
                   issue.longitude >= 68 && issue.longitude <= 97)
        }))
      );
      
      // Log any issues that might have swapped coordinates
      validIssues.forEach(issue => {
        const lat = issue.latitude;
        const lng = issue.longitude;
        
        // Check if coordinates might be swapped (common mistake)
        if (Math.abs(lng) < Math.abs(lat) && lat > 90) {
          console.warn(`Possible swapped coordinates for issue ${issue.issue_id}:`, {
            stored_lat: lat,
            stored_lng: lng,
            suggested_lat: lng,
            suggested_lng: lat
          });
        }
        
        // Check if coordinates are outside expected region
        if (lat < 6 || lat > 37 || lng < 68 || lng > 97) {
          console.warn(`Coordinates outside India for issue ${issue.issue_id}:`, {
            lat: lat,
            lng: lng,
            location: issue.location
          });
        }
      });
      
      setIssues(validIssues);
    } catch (error) {
      console.error('❌ Error fetching issues:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      
      // Try a fallback query without filters
      console.log('🔄 Trying fallback query...');
      try {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('issues')
          .select('*')
          .limit(10);
          
        if (fallbackError) {
          console.error('❌ Fallback query also failed:', fallbackError);
        } else {
          console.log('✅ Fallback query successful:', fallbackData);
          // Filter issues that have coordinates
          const issuesWithCoords = (fallbackData || []).filter(issue => 
            issue.latitude != null && issue.longitude != null
          );
          setIssues(issuesWithCoords);
        }
      } catch (fallbackErr) {
        console.error('❌ Fallback query error:', fallbackErr);
        setIssues([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, []);

  useEffect(() => {
    if (loading) {
      console.log('⏳ Map loading...');
      return;
    }
    
    console.log('🗺️ Initializing map with', issues.length, 'issues');
    console.log('Issues to render:', issues);
    
    const map = L.map("city-map");

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
    }).addTo(map);

    const markers = [];

    issues.forEach((issue) => {
      const lat = issue.latitude;
      const lng = issue.longitude;
      
      console.log(`Creating marker for issue ${issue.issue_id}:`, {
        latitude: lat,
        longitude: lng,
        coordinates: [lat, lng],
        location: issue.location
      });
      
      const marker = L.marker([lat, lng], { 
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
          <p style="margin: 4px 0; font-size: 11px; color: #999;"><strong>Coordinates:</strong> ${lat.toFixed(6)}, ${lng.toFixed(6)}</p>
          ${issue.images && Array.isArray(issue.images) && issue.images.length > 0 ? 
            `<img src="${issue.images[0]}" style="width: 100%; max-width: 180px; height: auto; margin-top: 8px; border-radius: 4px;" alt="Issue image" onerror="this.style.display='none'" />` 
            : ''
          }
        </div>
      `);

      markers.push(marker);
    });

    console.log(`✅ Created ${markers.length} markers on the map`);

    // Fit map to markers if any exist
    if (markers.length > 0) {
      console.log('📍 Fitting map bounds to show all markers');
      const group = L.featureGroup(markers);
      map.fitBounds(group.getBounds().pad(0.2));
    } else {
      console.log('🎯 No markers found, setting default view to Pondicherry');
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
