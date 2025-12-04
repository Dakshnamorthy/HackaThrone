import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from '../components/Navbar';
import './Help.css';

const faqData = [
  {
    question: "How do I report a civic issue?",
    answer: "Click on 'Report Issue' from the navbar, fill in the form with details, upload images, and submit."
  },
  {
    question: "Can I upload photos I took earlier?",
    answer: "Yes, you can upload photos from your device while reporting the issue."
  },
  {
    question: "How do I track the status of my complaint?",
    answer: "Visit the 'Complaint Status' page to view the progress of all submitted complaints."
  },
  {
    question: "What types of issues can I report?",
    answer: "You can report potholes, garbage, streetlight issues, water leaks, drainage problems, and other civic issues."
  },
  {
    question: "How long does it take for an issue to be resolved?",
    answer: "Resolution time varies depending on issue type and department workload. Check your complaint status for updates."
  },
  {
    question: "Who will see my submitted complaint?",
    answer: "Your complaint will be visible to the assigned municipal department and relevant authorities."
  },
  {
    question: "How do I update my profile or contact information?",
    answer: "Go to your profile settings to update your personal information and contact details."
  }
];

function Help() {
  const [activeIndex, setActiveIndex] = useState(null);

  const toggleFAQ = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <>
      <Navbar />
      <div className="help-container">
        <h1>Help & FAQ</h1>
        <p className="intro">
          Welcome to the Help page. Here you can find answers to common questions about using our civic issue reporting platform, along with tips to report issues effectively.
        </p>

        {/* FAQ Section */}
        <div className="faq-section">
          <h2>Frequently Asked Questions</h2>
          {faqData.map((item, index) => (
            <div key={index} className="faq-item">
              <div className="faq-question" onClick={() => toggleFAQ(index)}>
                {item.question}
                <span className="faq-toggle">{activeIndex === index ? "-" : "+"}</span>
              </div>
              {activeIndex === index && (
                <div className="faq-answer">
                  {item.answer}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Tips / Guidelines */}
        <div className="tips-section">
          <h2>Tips & Guidelines</h2>
          <ul>
            <li>Take clear, well-lit photos of the issue.</li>
            <li>Provide accurate and concise descriptions.</li>
            <li>Report multiple issues separately for clarity.</li>
            <li>Ensure your location is correct when submitting a complaint.</li>
          </ul>
        </div>

        {/* Contact Support */}
        <div className="contact-section">
          <h2>Contact Support</h2>
          <form className="contact-form">
            <label>Name</label>
            <input type="text" placeholder="Your Name" required />

            <label>Email</label>
            <input type="email" placeholder="Your Email" required />

            <label>Message</label>
            <textarea placeholder="Your Message" rows="5" required></textarea>

            <button type="submit" className="submit-btn">Send Message</button>
          </form>
          <p className="contact-info">Or reach us at support@civicapp.com | +91 9876543210</p>
        </div>
      </div>

      <footer className="footer">
        <p>© 2025 CivicApp. All Rights Reserved.</p>
        <div className="footer-links">
          <Link to="/about">About</Link> | <Link to="/contact">Contact</Link> | <Link to="/privacy-policy">Privacy Policy</Link> | <Link to="/terms">Terms</Link>
        </div>
      </footer>
    </>
  );
}

export default Help;
