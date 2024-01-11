// // ContactUs.jsx
// import React from "react";

// const About = () => {
//   // Styles
//   const infoSectionStyle = {
//     display: "flex",
//     justifyContent: "space-between",
//     alignItems: "center",
//     padding: "250px 60px",
//   };

//   const contactDetailsStyle = {
//     fontSize: "28px",
//     color: "#007bff",
//     cursor: "pointer", // Change cursor to indicate clickable
//   };

//   const rightSideContentStyle = {
//     textAlign: "right",
//     maxWidth: "650px",
//   };

//   return (
//     <div style={infoSectionStyle}>
//       <div className="flex items-center">
//         <img src="/vision.png" alt="logo" width="150" className="mr-10" />
//       </div>
//       {/* Left side content */}
//       <div style={{ maxWidth: "650px" }}>
//         <h1 style={{ marginBottom: "40px", fontSize: "50px" }}>Our Vision</h1>
//       </div>

//       {/* Right side content */}
//       <div style={rightSideContentStyle}>
//         <p style={contactDetailsStyle}>
//           <span>
//             Design a tool that facilitates cross-functional collaboration teams
//             to proactively identify and iterate on problematic design choices in
//             AI development.
//           </span>
//         </p>
//       </div>
//     </div>
//   );
// };

// export default About;

// import React from "react";

// const About = () => {
//   // Styles
//   const infoSectionStyle = {
//     display: "flex",
//     justifyContent: "space-between",
//     alignItems: "center",
//     padding: "300px 40px",
//     backgroundImage: "url('/vision.png')", // Set the background image
//     backgroundSize: "800px 800px", // Cover the entire div area
//     // Center the background image
//   };

//   const contactDetailsStyle = {
//     fontSize: "28px",
//     color: "#007bff",
//     cursor: "pointer", // Change cursor to indicate clickable
//     backgroundColor: "rgba(255, 255, 255, 0.5)", // Optional: for better readability
//     padding: "6px", // Optional: for better readability
//   };

//   const rightSideContentStyle = {
//     textAlign: "right",
//     maxWidth: "650px",
//   };

//   return (
//     <div style={infoSectionStyle}>
//       <div style={{ maxWidth: "650px" }}>
//         <h1 style={{ marginBottom: "40px", fontSize: "60px" }}>Our Vision</h1>
//       </div>

//       {/* Right side content */}
//       <div style={rightSideContentStyle}>
//         <p style={contactDetailsStyle}>
//           <span>
//             Design a tool that facilitates cross-functional collaboration teams
//             to proactively identify and iterate on problematic design choices in
//             AI development.
//           </span>
//         </p>
//       </div>
//     </div>
//   );
// };

// export default About;

import React from "react";
import { FaBold } from "react-icons/fa";

const About = () => {
  // Styles
  const infoSectionStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "300px 40px",
    backgroundImage: "url('/vision1.jpg')", // Set the background image
    backgroundSize: "700px auto", // Smaller background image
    backgroundRepeat: "no-repeat", // Prevent repeating the background image
    backgroundPosition: "center", // Optional: Center the image
  };

  const contactDetailsStyle = {
    fontSize: "28px",
    color: "#007bff",
    cursor: "pointer",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    padding: "6px",
  };

  const rightSideContentStyle = {
    textAlign: "right",
    maxWidth: "650px",
  };

  return (
    <div style={infoSectionStyle}>
      <div style={{ maxWidth: "650px" }}>
        <h1
          style={{
            marginBottom: "40px",
            fontSize: "75px",
            fontWeight: "bold",
            backgroundColor: "rgba(255, 255, 255, 0.6)",
            padding: "30px ",
          }}
        >
          Our Vision
        </h1>
      </div>

      {/* Right side content */}
      <div style={rightSideContentStyle}>
        <p style={contactDetailsStyle}>
          <span>
            Design a tool that facilitates cross-functional collaboration teams
            to proactively identify and iterate on problematic design choices in
            AI development.
          </span>
        </p>
      </div>
    </div>
  );
};

export default About;
