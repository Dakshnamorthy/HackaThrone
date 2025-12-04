// ReportIssue.jsx
import React, { useState } from "react";
import EXIF from "exif-js";
import Navbar from "../components/Navbar";
import "./ReportIssue.css";

function ReportIssue() {
  const [issueType, setIssueType] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [lat, setLat] = useState("");
  const [lon, setLon] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const gpsToDecimal = (gpsData, ref) => {
    if (!gpsData) return null;
    const [deg, min, sec] = gpsData;
    let decimal = deg + min / 60 + sec / 3600;
    if (ref === "S" || ref === "W") decimal = -decimal;
    return decimal;
  };

  const handleImageChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));

    // Read EXIF
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        EXIF.getData(img, function () {
          const latVal = gpsToDecimal(EXIF.getTag(this, "GPSLatitude"), EXIF.getTag(this, "GPSLatitudeRef"));
          const lonVal = gpsToDecimal(EXIF.getTag(this, "GPSLongitude"), EXIF.getTag(this, "GPSLongitudeRef"));
          if (latVal && lonVal) {
            setLat(latVal.toFixed(5));
            setLon(lonVal.toFixed(5));
            console.log("Using image EXIF location:", latVal, lonVal);
          } else {
            // fallback to browser geolocation
            if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition(
                (pos) => {
                  setLat(pos.coords.latitude.toFixed(5));
                  setLon(pos.coords.longitude.toFixed(5));
                  console.log("Using device location fallback:", pos.coords.latitude, pos.coords.longitude);
                },
                (err) => {
                  console.warn("Geolocation failed:", err);
                  // leave lat/lon empty -> submit blocked by validation
                }
              );
            }
          }
        });
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!issueType || !description || !imageFile) {
      alert("Please fill all fields and upload an image.");
      return;
    }
    if (!lat || !lon) {
      alert("Location not detected. Either upload GPS-enabled image or enable device location.");
      return;
    }

    setIsSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("issueType", issueType);
      fd.append("description", description);
      fd.append("lat", lat);
      fd.append("lon", lon);
      fd.append("images", imageFile); // backend accepts 'images' (multer.array)
      // If you want to allow multiple images, append each with 'images'

      const res = await fetch("http://localhost:3001/api/submit-issue", {
        method: "POST",
        body: fd,
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert(`✅ Issue submitted successfully! ID: ${data.issueId}`);
        // reset form
        setIssueType("");
        setDescription("");
        setImageFile(null);
        setImagePreview(null);
        setLat("");
        setLon("");
      } else {
        console.error("Submit failed backend:", data);
        alert("❌ Submission failed: " + (data.message || JSON.stringify(data)));
      }
    } catch (err) {
      console.error("Submit error:", err);
      alert("⚠️ Server error. Check backend console.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="reportIssue-container">
        <h1>Report an Issue</h1>
        <form onSubmit={handleSubmit} className="report-form">
          <label>Issue Type *</label>
          <select value={issueType} onChange={(e) => setIssueType(e.target.value)} required>
            <option value="">Select Type</option>
            <option value="Pothole">Pothole</option>
            <option value="Garbage">Garbage</option>
            <option value="Streetlight">Streetlight</option>
            <option value="Water">Water</option>
            <option value="Drainage">Drainage</option>
            <option value="Other">Other</option>
          </select>

          <label>Description *</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} required />

          <label>Upload Image *</label>
          <input type="file" accept="image/*" onChange={handleImageChange} required />
          <div className="image-preview-container">
            {imagePreview && <img src={imagePreview} alt="preview" style={{ maxWidth: 240 }} />}
          </div>

          <p>
            {lat && lon ? `📍 Detected Location: ${lat}, ${lon}` : "📍 Location: Not detected yet"}
          </p>

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Issue"}
          </button>
        </form>
      </div>
    </>
  );
}

export default ReportIssue;
