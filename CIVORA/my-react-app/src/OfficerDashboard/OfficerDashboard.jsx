// src/OfficerDashboard/OfficerDashboard.jsx
import React, { useState } from "react";
import Navbar from "../components/Navbar";
import "./OfficerDashboard.css";

function OfficerDashboard() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState("all");

  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:3001/api/all-issues");
      const data = await res.json();
      setIssues(data.issues || []);
      setActive("all");
    } catch (err) {
      console.error("fetchAll error:", err);
      alert("Error fetching all issues");
    }
    setLoading(false);
  };

  const fetchPrioritized = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:3001/api/prioritize-issues");
      const data = await res.json();
      setIssues(data.issues || []);
      setActive("priority");
    } catch (err) {
      console.error("fetchPrioritized error:", err);
      alert("Error fetching prioritized issues");
    }
    setLoading(false);
  };

  const formatDate = (iso) => {
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  };

  return (
    <>
      <Navbar />
      <div className="dashboard-container">
        <div className="dashboard-content">
          <div className="dashboard-header">
            <h1>Officer Dashboard</h1>
            <p>View all submitted issues and prioritized items for quick action.</p>
          </div>

          <div className="filter-buttons" role="tablist">
            <button
              className={active === "all" ? "active" : ""}
              onClick={fetchAll}
            >
              View All Issues
            </button>
            <button
              className={active === "priority" ? "active" : ""}
              onClick={fetchPrioritized}
            >
              Prioritize Issues
            </button>
          </div>

          {loading && (
            <div className="loading">
              <div className="spinner" />
              <div>Loading...</div>
            </div>
          )}

          {!loading && issues.length === 0 && (
            <div className="empty-state">No issues yet — click a button above.</div>
          )}

          {!loading && issues.length > 0 && (
            <div className="issues-grid">
              {issues.map((i) => {
                const score = Number(i.priority_score ?? 0);
                const pct = Math.max(0, Math.min(100, score * 100)); // assume score in 0..1
                return (
                  <div className="issue-card" key={i.id}>
                    <div className="issue-header">
                      <strong>#{i.id}</strong>
                      <div className={`status ${i.status ?? "pending"}`}>
                        {i.status ?? "Pending"}
                      </div>
                    </div>

                    <div className="issue-type">{i.issueType}</div>

                    <div className="priority-bar" aria-hidden>
                      <div style={{ width: 80, fontSize: 12, color: "#666" }}>
                        Priority:
                      </div>
                      <div className="bar-outer" style={{ flex: 1 }}>
                        <div
                          className="bar-inner"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="score">{(score).toFixed(2)}</div>
                    </div>

                    <div className="description">{i.description}</div>

                    <div style={{ display: "flex", gap: 12, marginTop: 8, flexWrap: "wrap" }}>
                      <div><strong>Location:</strong> {`${Number(i.lat).toFixed(4)}, ${Number(i.lon).toFixed(4)}`}</div>
                      <div><strong>Weather:</strong> {i.weather ?? "N/A"} {i.temp ? `(${i.temp}°C)` : ""}</div>
                      <div><strong>Traffic:</strong> {i.traffic_delay ?? "N/A"} s</div>
                      <div><strong>Repeat:</strong> {i.repeat_count ?? 0}</div>
                      <div><strong>Time:</strong> {formatDate(i.createdAt)}</div>
                    </div>

                    {i.images && i.images.length > 0 && (
                      <div className="issue-images">
                        {i.images.slice(0, 4).map((img, idx) => (
                          <img
                            key={idx}
                            className="thumb"
                            alt={`issue-${i.id}-${idx}`}
                            src={`http://localhost:3001/uploads/${img}`}
                            onError={(e) => (e.target.style.display = "none")}
                          />
                        ))}
                        {i.images.length > 4 && (
                          <div className="more">+{i.images.length - 4}</div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default OfficerDashboard;
