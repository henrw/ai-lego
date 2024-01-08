// // ContactUs.jsx
// import React from "react";

// const Contact = () => {
//   return (
//     <div
//       style={{
//         padding: "250px 60px",
//         textAlign: "left",
//         maxWidth: "650px",
//       }}
//     >
//       <h1 style={{ marginBottom: "40px", fontSize: "48px" }}>Contact Us</h1>
//       <p style={{ fontSize: "24px" }}>
//         Have questions? The quickest way to get in touch with us is using the
//         contact information next.
//       </p>
//       {/* Additional contact details and form (if needed) goes here */}
//     </div>
//   );
// };

// export default Contact;
// ContactUs.jsx
// import React from "react";

// const Contact = () => {
//   const infoSectionStyle = {
//     display: "flex",
//     justifyContent: "space-between", // This will place content on the left and right sides
//     alignItems: "center",
//     padding: "250px 60px", // Adjust padding as necessary
//   };

//   const contactDetailsStyle = {
//     fontSize: "20px", // Smaller font size for contact details
//     color: "#007bff", // Blue color for the email text
//   };

//   // Right side content container
//   const rightSideContentStyle = {
//     textAlign: "right", // Align the text to the right for the right side content
//     maxWidth: "300px", // Max width for the right side content
//   };

//   return (
//     <div style={infoSectionStyle}>
//       <div style={{ maxWidth: "650px" }}>
//         <h1 style={{ marginBottom: "40px", fontSize: "48px" }}>Contact Us</h1>
//         <p style={{ fontSize: "24px" }}>
//           Have questions? The quickest way to get in touch with us is using the
//           contact information below.
//         </p>
//         {/* Left side content goes here */}
//       </div>
//       <div style={rightSideContentStyle}>
//         {/* Right side content with contact details */}
//         <p style={contactDetailsStyle}>
//           <span role="img" aria-label="email">
//             📧🧑🏻‍🔬
//           </span>{" "}
//           Primary Researcher:{" "}
//           <a href="mailto:hongs@andrew.cmu.edu" style={contactDetailsStyle}>
//             hongs@andrew.cmu.edu
//           </a>
//         </p>
//         <p style={contactDetailsStyle}>
//           <span role="img" aria-label="email">
//             📧👩🏻‍💻
//           </span>{" "}
//           Primary Developer:{" "}
//           <a href="mailto:shuyih1125@gmail.com" style={contactDetailsStyle}>
//             shuyih1125@gmail.com
//           </a>
//         </p>
//       </div>
//     </div>
//   );
// };

// export default Contact;

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
          contact information below.
        </p>
      </div>

      {/* Right side content */}
      <div style={rightSideContentStyle}>
        <p style={contactDetailsStyle}>
          <span
            style={emojiStyle}
            role="img"
            aria-label="email"
            onClick={() => copyToClipboard("hongs@andrew.cmu.edu")}
          >
            📧🧑🏻‍🔬
          </span>
          Primary Researcher:{" "}
          <a href="mailto:hongs@andrew.cmu.edu" style={contactDetailsStyle}>
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
