import { useState } from "react";
import EXIF from "exif-js";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/SimpleAuthContext";
import { supabase } from "../../supabaseClient";
import { useNavigate } from "react-router-dom";
import VerificationGuard from "../citizen/VerificationGuard";
import "./ReportIssue.css";

function ReportIssue() {
  const [issueType, setIssueType] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [location, setLocation] = useState("");
  const [coordinates, setCoordinates] = useState({ lat: null, lng: null });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [showLocationQuestion, setShowLocationQuestion] = useState(true);
  const [isAtLocation, setIsAtLocation] = useState(null);
  const [ticketNumber, setTicketNumber] = useState("");
  const { user } = useAuth();
  const navigate = useNavigate();

  // Convert EXIF GPS data to decimal
  const gpsToDecimal = (gpsData, ref) => {
    if (!gpsData) return null;
    const [deg, min, sec] = gpsData;
    let decimal = deg + min / 60 + sec / 3600;
    if (ref === "S" || ref === "W") decimal = -decimal;
    return decimal.toFixed(5);
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImages(files);
    const previews = files.map((file) => URL.createObjectURL(file));
    setImagePreviews(previews);
  };

  // Handle location question responses
  const handleLocationResponse = (response) => {
    setIsAtLocation(response);
    setShowLocationQuestion(false);
    
    if (response) {
      // User is at location, use GPS
      detectLocation();
    }
    // If not at location, they'll enter manually
  };

  // Simple location detection using GPS for all devices
  const detectLocation = async () => {
    if (!navigator.geolocation) {
      alert("❌ Geolocation is not supported by this browser.");
      return;
    }

    setIsDetectingLocation(true);

    const options = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const accuracy = position.coords.accuracy;
        
        setLocation(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
        setCoordinates({ lat, lng });
        setIsDetectingLocation(false);
        
        alert(`📍 Location detected!\nLatitude: ${lat.toFixed(6)}\nLongitude: ${lng.toFixed(6)}\nAccuracy: ${Math.round(accuracy)}m`);
      },
      (error) => {
        setIsDetectingLocation(false);
        let errorMessage = "❌ Unable to get your location. ";
        
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += "Location access denied. Please allow location access and try again.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += "Location information unavailable. Please try again.";
            break;
          case error.TIMEOUT:
            errorMessage += "Location request timed out. Please try again.";
            break;
          default:
            errorMessage += "An unknown error occurred. Please try again.";
            break;
        }
        alert(errorMessage);
      },
      options
    );
  };

  // Geocode address to get coordinates when manually entered
  const geocodeAddress = async (address) => {
    try {
      // Using a simple geocoding approach - you can replace with Google Maps API or other service
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`);
      const data = await response.json();
      
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        };
      }
      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!issueType || !description || !location) {
      alert("Please fill in all required fields.");
      return;
    }

    if (!user) {
      alert("Please log in to report an issue.");
      navigate('/login');
      return;
    }

    setIsSubmitting(true);

    // If coordinates are not available (manual entry), try to geocode
    let finalCoordinates = coordinates;
    if (!coordinates.lat || !coordinates.lng) {
      console.log('No GPS coordinates available, attempting to geocode address...');
      const geocodedCoords = await geocodeAddress(location);
      if (geocodedCoords) {
        finalCoordinates = geocodedCoords;
        console.log('Geocoded coordinates:', geocodedCoords);
      } else {
        console.log('Geocoding failed, proceeding without coordinates');
        finalCoordinates = { lat: null, lng: null };
      }
    }

    try {
      // Upload images to Supabase storage (if any)
      let imageUrls = [];
      if (images.length > 0) {
        for (let i = 0; i < images.length; i++) {
          const file = images[i];
          const fileName = `${Date.now()}_${i}_${file.name}`;
          
          try {
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('issue-images')
              .upload(fileName, file);

            if (uploadError) {
              console.error('Image upload error:', uploadError);
              // Continue without image if upload fails
            } else {
              const { data: { publicUrl } } = supabase.storage
                .from('issue-images')
                .getPublicUrl(fileName);
              imageUrls.push(publicUrl);
            }
          } catch (storageError) {
            console.error('Storage error:', storageError);
            // Continue without image if storage fails
          }
        }
      }

      // Create issue in database
      console.log('Submitting issue with data:', {
        citizen_id: user.id,
        type: issueType,
        description,
        location,
        latitude: finalCoordinates.lat,
        longitude: finalCoordinates.lng,
        images: imageUrls,
        status: 'Pending',
        priority: 'Medium'
      });

      const { data: issueData, error: issueError } = await supabase
        .from('issues')
        .insert([{
          citizen_id: user.id,
          type: issueType,
          description,
          location,
          latitude: finalCoordinates.lat,
          longitude: finalCoordinates.lng,
          images: imageUrls,
          status: 'Pending',
          priority: 'Medium'
        }])
        .select()
        .single();

      console.log('Supabase response:', { issueData, issueError });

      if (issueError) {
        console.error('Database error details:', issueError);
        throw issueError;
      }

      // Show success message with generated issue ID
      setTicketNumber(issueData.issue_id);
      
      // Reset form
      setIssueType("");
      setDescription("");
      setImages([]);
      setImagePreviews([]);
      setLocation("");
      setCoordinates({ lat: null, lng: null });
      setShowLocationQuestion(true);
      setIsAtLocation(null);

      alert(`Issue submitted successfully! Ticket Number: ${issueData.issue_id}`);
      
      // Redirect to complaint status page
      setTimeout(() => {
        navigate('/complaint-status');
      }, 2000);

    } catch (error) {
      console.error('Error submitting issue:', error);
      
      // Provide specific error messages
      if (error.message.includes('relation "issues" does not exist')) {
        alert('Database table not found. Please run the CREATE_ISSUES_TABLE.sql script in Supabase first.');
      } else if (error.message.includes('permission denied')) {
        alert('Permission error. Please check if you are logged in and try again.');
      } else if (error.message.includes('violates row-level security')) {
        alert('Security policy error. Please make sure you are logged in as a citizen.');
      } else {
        alert(`Error submitting issue: ${error.message}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />
      <VerificationGuard>
        <div className="reportIssue-container">
          <h1>Report an Issue</h1>
          <p>Help us keep the city clean and safe by reporting civic issues.</p>
          <form className="report-form" onSubmit={handleSubmit}>
          <label htmlFor="issueType">Issue Type *</label>
          <select
            id="issueType"
            value={issueType}
            onChange={(e) => setIssueType(e.target.value)}
            required
          >
            <option value="">Select Issue Type</option>
            <option value="Pothole">Pothole</option>
            <option value="Garbage">Garbage</option>
            <option value="Streetlight">Streetlight</option>
            <option value="Water">Water</option>
            <option value="Drainage">Drainage</option>
            <option value="Fallen/damaged electric poles">Fallen/damaged electric poles</option>
            <option value="Exposed or hanging wires posing safety hazards">
              Exposed or hanging wires posing safety hazards
            </option>
            <option value="Broken or leaking water pipelines">Broken or leaking water pipelines</option>
            <option value="Non-functional hand pumps or borewells">
              Non-functional hand pumps or borewells
            </option>
            <option value="Other">Other</option>
          </select>

          <label htmlFor="description">Description *</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Provide a detailed description of the issue"
            required
          ></textarea>

          <label htmlFor="images">Take a Photo or Upload Image</label>
          <input
            id="images"
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
          />
          <div className="image-preview-container">
            {imagePreviews.map((src, index) => (
              <img key={index} src={src} alt={`preview ${index}`} />
            ))}
          </div>

          <label htmlFor="location">Location *</label>
          
          {showLocationQuestion ? (
            <div className="location-question">
              <div className="question-text">
                <p>📍 Are you currently at the location where the issue is occurring?</p>
              </div>
              <div className="question-buttons">
                <button 
                  type="button" 
                  className="location-btn yes-btn"
                  onClick={() => handleLocationResponse(true)}
                >
                  ✅ Yes, I'm here
                </button>
                <button 
                  type="button" 
                  className="location-btn no-btn"
                  onClick={() => handleLocationResponse(false)}
                >
                  ❌ No, I'm elsewhere
                </button>
              </div>
            </div>
          ) : (
            <div className="location-inputs">
              {isAtLocation ? (
                <>
                  <input
                    id="location"
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Location will be detected automatically"
                    required
                    readOnly={isDetectingLocation}
                  />
                  <button type="button" onClick={detectLocation} disabled={isDetectingLocation}>
                    {isDetectingLocation ? "🔍 Getting Location..." : "📍 Detect My Location"}
                  </button>
                  <div className="location-help">
                    <small>💡 Allow location access when prompted</small>
                  </div>
                </>
              ) : (
                <>
                  <input
                    id="location"
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Enter the location where the issue is occurring"
                    required
                  />
                  <div className="location-help">
                    <small>💡 Please enter the exact address or landmark</small>
                  </div>
                </>
              )}
              <button 
                type="button" 
                className="change-location-btn"
                onClick={() => {
                  setShowLocationQuestion(true);
                  setIsAtLocation(null);
                  setLocation("");
                }}
              >
                🔄 Change Location Method
              </button>
            </div>
          )}

          <button type="submit" className="submit-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit Issue'}
          </button>
        </form>

        {ticketNumber && (
          <div className="ticket-confirmation">
            <p>
              Your issue has been submitted successfully! Ticket Number:{" "}
              <strong>{ticketNumber}</strong>
            </p>
          </div>
        )}
      </div>

      <footer className="footer">
        <p>© 2025 CivicApp. All Rights Reserved.</p>
        <div className="footer-links">
          <a href="#">About</a> | <a href="#">Contact</a> |{" "}
          <a href="#">Privacy Policy</a> | <a href="#">Terms</a>
        </div>
      </footer>
      </VerificationGuard>
    </>
  );
}

export default ReportIssue;
