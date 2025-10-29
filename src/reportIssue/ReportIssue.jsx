import { useState } from "react";
import EXIF from "exif-js";
import Navbar from "../components/Navbar";
import "./ReportIssue.css";

function ReportIssue() {
  const [issueType, setIssueType] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [location, setLocation] = useState("");
  const [ticketNumber, setTicketNumber] = useState(null);

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

  const detectLocation = () => {
    if (images.length === 0) {
      alert("Please upload an image first.");
      return;
    }

    let locationFound = false;

    images.forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          EXIF.getData(img, function () {
            const lat = gpsToDecimal(
              EXIF.getTag(this, "GPSLatitude"),
              EXIF.getTag(this, "GPSLatitudeRef")
            );
            const lon = gpsToDecimal(
              EXIF.getTag(this, "GPSLongitude"),
              EXIF.getTag(this, "GPSLongitudeRef")
            );

            if (lat && lon && !locationFound) {
              setLocation(`${lat}, ${lon}`);
              locationFound = true;
              alert(
                `✅ Location extracted from image ${index + 1}: ${lat}, ${lon}`
              );
            }
          });
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });

    // If no location found after checking all images
    setTimeout(() => {
      if (!locationFound) {
        alert("⚠️ No GPS coordinates found in any uploaded image. Please enter location manually.");
      }
    }, 1000 * images.length);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!issueType || !description || !location) {
      alert("Please fill in all required fields.");
      return;
    }

    const ticket = "CIV-" + Math.floor(Math.random() * 1000000);
    setTicketNumber(ticket);

    setIssueType("");
    setDescription("");
    setImages([]);
    setImagePreviews([]);
    setLocation("");

    alert(`Issue submitted successfully! Ticket Number: ${ticket}`);
  };

  return (
    <>
      <Navbar />
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
          <div className="location-inputs">
            <input
              id="location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Enter location or detect from image"
              required
            />
            <button type="button" onClick={detectLocation}>
              Detect My Location
            </button>
          </div>

          <button type="submit" className="submit-btn">
            Submit Issue
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
    </>
  );
}

export default ReportIssue;
