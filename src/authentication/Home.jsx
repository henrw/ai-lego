// import React from "react";
// import { Button } from "react-bootstrap";
// import { useNavigate } from "react-router";
// import { useUserAuth } from "./UserAuthContext";

// const Home = () => {
//   const { user } = useUserAuth();
//   const navigate = useNavigate();

//   const handleLoginRedirect = () => {
//     // Navigate to the login page
//     navigate("/");
//   };

//   return (
//     <>
//       <div className="pt-20 relative text-center">
//         Thank you for visiting! <br />
//         {user && user.email}
//       </div>
//       {!user && (
//         <div className="d-flex justify-center">
//           <button
//             onClick={handleLoginRedirect}
//             className="border border-blue-500 hover:bg-blue-500 text-blue-700 font-semibold hover:text-white py-1 px-2 hover:border-transparent rounded"
//           >
//             Log In
//           </button>
//         </div>
//       )}
//     </>
//   );
// };

// export default Home;

// import React, { useState } from "react";
// import { Button, Modal } from "react-bootstrap";
// import { useNavigate } from "react-router";
// import { useUserAuth } from "./UserAuthContext";

// const Home = () => {
//   const { user } = useUserAuth();
//   const navigate = useNavigate();
//   const [showModal, setShowModal] = useState(true); // State to control the visibility of the modal
//   const [occupation, setOccupation] = useState("");
//   const [customOccupation, setCustomOccupation] = useState("");

//   const handleLoginRedirect = () => {
//     navigate("/");
//   };
//   const handleOccupationChange = (e) => {
//     const value = e.target.value;
//     setOccupation(value);
//     // Reset custom occupation if not 'Other'
//     if (value !== "Other") {
//       setCustomOccupation("");
//     }
//   };

//   return (
//     <>
//       {!user && (
//         <div className="pt-20 relative text-center">
//           Welcome Guest!
//           <div className="flex justify-center mt-4">
//             <Button onClick={handleLoginRedirect} variant="outline-primary">
//               Log In
//             </Button>
//           </div>
//         </div>
//       )}

//       <Modal
//         show={showModal}
//         // onHide={() => setShowModal(false)}
//         size="xl"
//         aria-labelledby="contained-modal-title-vcenter"
//         centered
//       >
//         <Modal.Header
//           closeButto
//           className="border border-blue-400 bg-blue-400"
//         >
//           <div>
//             <p className="text-white mb-2">Welcome to AI LEGO, Shuyi!</p>{" "}
//             <Modal.Title
//               id="contained-modal-title-vcenter"
//               className="text-white"
//             >
//               Get personalized information for buidling project more efficiently
//             </Modal.Title>
//           </div>
//         </Modal.Header>
//         Work Experience
//         <Modal.Body className="h-64">
//           <form className="space-y-4">
//             <div className="flex justify-between space-x-4">
//               {/* Occupation Dropdown */}
//               <div className="flex-1">
//                 <label
//                   htmlFor="occupation"
//                   className="block text-xl font-semibold mb-2"
//                 >
//                   Occupation
//                 </label>
//                 <select
//                   id="occupation"
//                   name="occupation"
//                   className="mt-1 block w-full border-2 border-blue-500 shadow-sm rounded-md"
//                   value={occupation}
//                   onChange={handleOccupationChange}
//                 >
//                   <option value="">Select an option</option>
//                   <option value="Product Manager">Product Manager</option>
//                   <option value="UI/UX Designer">UI/UX Designer</option>
//                   <option value="AI Developer">AI Developer</option>

//                   <option value="Other">Other (Please specify)</option>
//                 </select>
//                 {occupation === "Other" && (
//                   <input
//                     type="text"
//                     value={customOccupation}
//                     onChange={(e) => setCustomOccupation(e.target.value)}
//                     placeholder="Enter your occupation"
//                     className="mt-1 block text-base border-2 border-blue-500 rounded-md shadow-sm "
//                   />
//                 )}
//               </div>

//               <div className="flex-1">
//                 <label
//                   htmlFor="experience-level"
//                   className="block text-xl font-semibold mb-2"
//                 >
//                   Experience Level
//                 </label>
//                 <select
//                   id="experience-level"
//                   name="experience-level"
//                   className="mt-1 block w-full border-2 border-blue-500 shadow-sm rounded-md"
//                 >
//                   <option>Entry</option>
//                   <option>Mid</option>
//                   <option>Senior</option>
//                   {/* ...other options */}
//                 </select>
//               </div>

//               {/* Employer Dropdown */}
//               <div className="flex-1">
//                 <label
//                   htmlFor="employer"
//                   className="block text-xl font-semibold mb-2"
//                 >
//                   Employer
//                 </label>
//                 <select
//                   id="employer"
//                   name="employer"
//                   className="mt-1 block w-full border-2 border-blue-500 shadow-sm rounded-md"
//                 >
//                   <option>Google</option>
//                   <option>Amazon</option>
//                   <option>Facebook</option>
//                   {/* ...other options */}
//                 </select>
//               </div>
//             </div>
//           </form>
//         </Modal.Body>
//         <Modal.Footer>
//           <button
//             onClick={() => setShowModal(false)}
//             class="border border-blue-500 hover:bg-blue-500 text-blue-500 font-semibold hover:text-white py-1 px-2 hover:border-blue rounded"
//           >
//             Skip
//           </button>
//           <button
//             onClick={() => setShowModal(false)}
//             className="border border-blue-500 bg-blue-500 text-white font-semibold py-1 px-2 rounded hover:bg-blue-600"
//           >
//             Continue
//           </button>
//         </Modal.Footer>
//       </Modal>
//     </>
//   );
// };

// export default Home;

import React, { useState } from "react";
import { Button, Modal } from "react-bootstrap";
import { useNavigate } from "react-router";
import { useUserAuth } from "./UserAuthContext";

const Home = () => {
  const { user } = useUserAuth();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(true); // State to control the visibility of the modal

  // Combined state object for all fields
  const [fields, setFields] = useState({
    occupation: "",
    customOccupation: "",
    experienceLevel: "",
    customExperienceLevel: "",
    employer: "",
    customEmployer: "",
    department: "",
    customDepartment: "",
  });

  // Generic change handler for all fields
  const handleFieldChange = (fieldName) => (e) => {
    const value = e.target.value;
    setFields((prevFields) => ({
      ...prevFields,
      [fieldName]: value,
      ...(value !== "Other" && {
        [`custom${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}`]: "",
      }), // Reset custom field if not 'Other'
    }));
  };

  const handleLoginRedirect = () => {
    navigate("/");
  };

  return (
    <>
      {!user && (
        <div className="pt-20 relative text-center">
          Welcome Guest!
          <div className="flex justify-center mt-4">
            <Button onClick={handleLoginRedirect} variant="outline-primary">
              Log In
            </Button>
          </div>
        </div>
      )}

      <Modal
        show={showModal}
        // onHide={() => setShowModal(false)}
        size="xl"
        aria-labelledby="contained-modal-title-vcenter"
        centered
      >
        <Modal.Header
          closeButton
          className="border border-blue-400 bg-blue-400"
        >
          <div>
            <p className="text-white mb-2">
              Welcome {user ? user.email : "Guest"}!
            </p>{" "}
            <Modal.Title
              id="contained-modal-title-vcenter"
              className="text-white"
            >
              Get personalized information for building project more efficiently
            </Modal.Title>
          </div>
        </Modal.Header>
        Work Experience
        <Modal.Body className="h-104">
          <div className="flex">
            <form className="space-y-4 w-1/3">
              <div>
                <label
                  htmlFor="occupation"
                  className="block text-xl font-semibold mb-2"
                >
                  Occupation
                </label>
                <select
                  id="occupation"
                  name="occupation"
                  className="mt-1 block w-full border-2 border-blue-500 shadow-sm rounded-md"
                  value={fields.occupation}
                  onChange={handleFieldChange("occupation")}
                >
                  <option value="">Select an option</option>
                  <option value="Product Manager">Product Manager</option>
                  <option value="UI/UX Designer">UI/UX Designer</option>
                  <option value="AI Developer">AI Developer</option>
                  <option value="Other">Other (Please specify)</option>
                </select>
                {fields.occupation === "Other" && (
                  <input
                    type="text"
                    value={fields.customOccupation}
                    onChange={handleFieldChange("customOccupation")}
                    placeholder="Enter your occupation"
                    className="mt-1 block w-full border-2 border-blue-500 rounded-md shadow-sm "
                  />
                )}
              </div>

              {/* Experience Level Dropdown */}
              <div>
                <label
                  htmlFor="experienceLevel"
                  className="block text-xl font-semibold mb-2"
                >
                  Experience Level
                </label>
                <select
                  id="experienceLevel"
                  name="experienceLevel"
                  className="mt-1 block w-full border-2 border-blue-500 shadow-sm rounded-md"
                  value={fields.experienceLevel}
                  onChange={handleFieldChange("experienceLevel")}
                >
                  <option value="">Select an option</option>
                  <option value="Junior">Intern / Trainee</option>
                  <option value="Mid-Level">Junior / Entry Level</option>
                  <option value="Senior">Mid-level</option>
                  <option value="Lead/Manager">Lead / Manager</option>
                  <option value="Senior Manager/Director">
                    Senior Manager / Director
                  </option>
                  <option value="Executive">Executive</option>
                  <option value="Other">Other (Please specify)</option>
                </select>
                {fields.experienceLevel === "Other" && (
                  <input
                    type="text"
                    value={fields.customExperienceLevel}
                    onChange={handleFieldChange("customExperienceLevel")}
                    placeholder="Enter your experience level"
                    className="mt-1 block w-full border-2 border-blue-500 rounded-md shadow-sm "
                  />
                )}
              </div>

              {/* Employer Dropdown */}
              <div>
                <label
                  htmlFor="employer"
                  className="block text-xl font-semibold mb-2"
                >
                  Employer
                </label>
                <select
                  id="employer"
                  name="employer"
                  className="mt-1 block w-full border-2 border-blue-500 shadow-sm rounded-md"
                  value={fields.employer}
                  onChange={handleFieldChange("employer")}
                >
                  <option value="">Select an option</option>
                  <option value="Other">Other (Please specify)</option>
                </select>
                {fields.employer === "Other" && (
                  <input
                    type="text"
                    value={fields.customEmployer}
                    onChange={handleFieldChange("customEmployer")}
                    placeholder="Enter your employer"
                    className="mt-1 block w-full border-2 border-blue-500 rounded-md shadow-sm "
                  />
                )}
              </div>

              {/* Department Dropdown */}
              <div>
                <label
                  htmlFor="department"
                  className="block text-xl font-semibold mb-2"
                >
                  Department
                </label>
                <select
                  id="department"
                  name="department"
                  className="mt-1 block w-full border-2 border-blue-500 shadow-sm rounded-md"
                  value={fields.department}
                  onChange={handleFieldChange("department")}
                >
                  <option value="">Select an option</option>
                  <option value="Other">Other (Please specify)</option>
                </select>
                {fields.department === "Other" && (
                  <input
                    type="text"
                    value={fields.customDepartment}
                    onChange={handleFieldChange("customDepartment")}
                    placeholder="Enter your employer"
                    className="mt-1 block w-full border-2 border-blue-500 rounded-md shadow-sm "
                  />
                )}
              </div>
            </form>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button
            onClick={() => setShowModal(false)}
            class="border border-blue-500 hover:bg-blue-500 text-blue-500 font-semibold hover:text-white py-1 px-2 hover:border-blue rounded"
          >
            Skip
          </button>
          <button
            onClick={() => setShowModal(false)}
            className="border border-blue-500 bg-blue-500 text-white font-semibold py-1 px-2 rounded hover:bg-blue-600"
          >
            Continue
          </button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default Home;
