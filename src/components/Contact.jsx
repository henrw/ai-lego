// ContactUs.jsx
import React from "react";

const Contact = () => {
  // Function to copy email address to clipboard
  const copyToClipboard = (email) => {
    navigator.clipboard.writeText(email).then(
      () => {
        alert(`Copied ${email} to clipboard.`);
      },
      (err) => {
        console.error("Could not copy text: ", err);
      }
    );
  };

  // Styles
  const infoSectionStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "250px 60px",
  };

  const contactDetailsStyle = {
    fontSize: "20px",
    color: "#007bff",
    cursor: "pointer", // Change cursor to indicate clickable
  };

  const emojiStyle = {
    fontSize: "32px", // Larger font size for emojis
    cursor: "pointer", // Change cursor to indicate clickable
  };

  const rightSideContentStyle = {
    textAlign: "right",
    maxWidth: "300px",
  };

  return (
    <div style={infoSectionStyle}>
      {/* Left side content */}
      <div style={{ maxWidth: "650px" }}>
        <h1 style={{ marginBottom: "40px", fontSize: "48px" }}>Contact Us</h1>
        <p style={{ fontSize: "24px" }}>
          Have questions? The quickest way to get in touch with us is using the
          contact information next.
        </p>
      </div>

      {/* Right side content */}
      <div style={rightSideContentStyle}>
        <p style={contactDetailsStyle}>
          <span
            style={emojiStyle}
            role="img"
            aria-label="email"
            onClick={() => copyToClipboard("xxxxx@andrew.cmu.edu")}
          >
            📧🧑🏻‍🔬
          </span>
          Primary Researcher:{" "}
          <a href="mailto:xxxxx@andrew.cmu.edu" style={contactDetailsStyle}>
            hongs@andrew.cmu.edu
          </a>
        </p>
        <p style={contactDetailsStyle}>
          <span
            style={emojiStyle}
            role="img"
            aria-label="email"
            onClick={() => copyToClipboard("shuyih1125@gmail.com")}
          >
            📧👩🏻‍💻
          </span>
          Primary Developer:{" "}
          <a href="mailto:shuyih1125@gmail.com" style={contactDetailsStyle}>
            shuyih1125@gmail.com
          </a>
        </p>
      </div>
    </div>
  );
};

export default Contact;
