// Home.jsx
import React, { useState, useEffect } from "react";
import { Button, Modal } from "react-bootstrap";
import { useNavigate } from "react-router";
import { useUserAuth } from "./UserAuthContext";
import { useLocation } from "react-router-dom";
import { FaUserCircle } from "react-icons/fa";
import { db } from "../firebase"; // Ensure you have this import
import { doc, getDoc, updateDoc } from "firebase/firestore"; // Import Firestore document update functions
import {
  ref,
  uploadBytes,
  deleteObject,
  getDownloadURL,
} from "firebase/storage";
import { storage } from "../firebase";

const Home = () => {
  const { user } = useUserAuth();
  const navigate = useNavigate();
  const location = useLocation(); // Get location to access state
  const [showModal, setShowModal] = useState(false); // Default to false
  const [userProfile, setUserProfile] = useState({});
  // Combined state object for all fields
  const [fields, setFields] = useState({
    occupation: "",
    experienceLevel: "",
    employer: "",
    department: "",
  });
  // New state to track custom input values
  const [customInputs, setCustomInputs] = useState({
    customOccupation: "",
    customExperienceLevel: "",
    customEmployer: "",
    customDepartment: "",
  });
  // Add a state to handle the selected file
  // Add a state for the selected file
  const [selectedFile, setSelectedFile] = useState(null);
  const [profileImageUrl, setProfileImageUrl] = useState("");

  const handleCustomInputChange = (fieldName) => (e) => {
    setCustomInputs((prevCustomInputs) => ({
      ...prevCustomInputs,
      [fieldName]: e.target.value,
    }));
  };

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user?.uid) {
        // Check if user and user.uid is not undefined
        const userDocRef = doc(db, "users", user.uid);
        try {
          const docSnap = await getDoc(userDocRef);
          if (docSnap.exists()) {
            setUserProfile(docSnap.data());
          } else {
            console.log("No such document!");
          }
        } catch (error) {
          console.error("Error fetching user profile: ", error);
        }
      }
    };

    fetchUserProfile();
  }, [user]);

  useEffect(() => {
    // Check if coming from signup with a new user
    if (location.state?.newUser) {
      setShowModal(true);
    }
  }, [location]);

  const handleFieldChange = (fieldName) => (e) => {
    setFields((prevFields) => ({ ...prevFields, [fieldName]: e.target.value }));
  };

  const handleImageChange = (e) => {
    console.log("Handling image change...");
    if (e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      console.log("Selected file:", file);
    } else {
      console.log("No file selected.");
    }
  };

  const uploadProfileImage = async () => {
    console.log("Starting image upload...");
    if (!selectedFile) {
      console.log("No file to upload.");
      return;
    }

    try {
      const storageRef = ref(
        storage,
        `profile_pictures/${user?.uid}/${selectedFile.name}`
      );
      await uploadBytes(storageRef, selectedFile);
      console.log("File uploaded. Fetching download URL...");
      const imageUrl = await getDownloadURL(storageRef);
      setProfileImageUrl(imageUrl);
      console.log("Image URL set:", imageUrl);

      // Update the user profile with the new image URL
      await updateDoc(doc(db, "users", user?.uid), {
        profile_picture: imageUrl,
      });
      console.log("User profile updated with new image URL.");
    } catch (error) {
      console.error("Error during image upload:", error);
    }
  };

  const deleteProfileImage = async () => {
    console.log("Starting image deletion...");
    if (!selectedFile) {
      console.log("No file to delete.");
      return;
    }

    try {
      const storageRef = ref(
        storage,
        `profile_pictures/${user?.uid}/${selectedFile.name}`
      );
      await deleteObject(storageRef);
      console.log("Image deleted from storage.");
      setProfileImageUrl("");

      // Update the user profile to remove the image URL
      await updateDoc(doc(db, "users", user?.uid), { profile_picture: null });
      console.log("User profile image URL removed.");
    } catch (error) {
      console.error("Error during image deletion:", error);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    // Check for empty fields
    if (Object.values(fields).some((field) => field === "")) {
      alert("Please fill in all fields.");
      return;
    }

    // Prepare final data to be submitted
    let finalData = {
      ...fields,
      profile_picture: profileImageUrl, // Include the profile image URL
    };

    // Replace "Other" fields with custom input values
    Object.keys(fields).forEach((field) => {
      if (
        fields[field] === "Other" &&
        customInputs[`custom${field.charAt(0).toUpperCase() + field.slice(1)}`]
      ) {
        finalData[field] =
          customInputs[
            `custom${field.charAt(0).toUpperCase() + field.slice(1)}`
          ];
      }
    });

    // Check if user is available before updating the document
    if (user) {
      try {
        await updateDoc(doc(db, "users", user.uid), finalData);
        setShowModal(false);
        // You may want to navigate the user to a different page or give feedback
      } catch (error) {
        console.error("Error updating document: ", error);
        // Handle the error appropriately
      }
    }
  };

  const handleLoginRedirect = () => {
    navigate("/");
  };
  const handleProfileUpdate = async () => {
    // Update Firestore document
    await updateDoc(doc(db, "users", user.uid), {
      ...fields, // Spread the fields state to update the document
    });
    setShowModal(false); // Close the modal after update
  };
  const isOtherSelected = (fieldName) => {
    return fields[fieldName] === "Other";
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
              Welcome {userProfile.fullName || "Guest"}!
            </p>

            <Modal.Title
              id="contained-modal-title-vcenter"
              className="text-white"
            >
              Get personalized information for building project more efficiently
            </Modal.Title>
          </div>
        </Modal.Header>

        <Modal.Body className="h-104 flex">
          <div className="w-1/3 flex flex-col items-center justify-center p-4 border-r">
            {profileImageUrl ? (
              <img
                src={profileImageUrl}
                alt="Profile"
                className="w-60 h-60 rounded-full overflow-hidden"
              />
            ) : (
              <FaUserCircle size="100%" className="text-gray-300" />
            )}
            <h3 className="text-xl font-semibold mb-2">Public Profile</h3>
            <div className="mb-2">
              <label htmlFor="profileImage" className="btn btn-primary mb-2">
                Choose Image
              </label>
              <input
                id="profileImage"
                type="file"
                onChange={handleImageChange}
                className="d-none"
              />
            </div>
            <button
              className="text-lg  text-blue-500 hover:text-blue-600 mb-2"
              onClick={uploadProfileImage}
            >
              Upload Image
            </button>
            <button
              className="text-lg text-gray-600 hover:text-gray-700"
              onClick={deleteProfileImage}
            >
              Delete Image
            </button>
          </div>
          {/* <div className=""> */}
          <form className="w-3/5 p-16" onSubmit={handleSubmit}>
            <h3 className="text-2xl  mb-2">Work Experience</h3>
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
                  value={customInputs.customOccupation}
                  onChange={handleCustomInputChange("customOccupation")}
                  placeholder="Enter your occupation"
                  className="mt-1 block w-full border-2 border-blue-500 rounded-md shadow-sm"
                />
              )}
            </div>

            {/* Experience Level Dropdown */}
            <div>
              <label
                htmlFor="experienceLevel"
                className="mt-3 block text-xl font-semibold mb-2"
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
                  value={customInputs.experienceLevel}
                  onChange={handleCustomInputChange("customExrienceLevel")}
                  placeholder="Enter your experience level"
                  className="mt-1 block w-full border-2 border-blue-500 rounded-md shadow-sm"
                />
              )}
            </div>

            {/* Employer Dropdown */}
            <div>
              <label
                htmlFor="employer"
                className="mt-3 block text-xl font-semibold mb-2"
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
                  value={customInputs.customEmployer}
                  onChange={handleCustomInputChange("customEmployer")}
                  placeholder="Enter your employer"
                  className="mt-1 block w-full border-2 border-blue-500 rounded-md shadow-sm"
                />
              )}
            </div>

            {/* Department Dropdown */}
            <div>
              <label
                htmlFor="department"
                className="mt-3 block text-xl font-semibold mb-2"
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
                  value={customInputs.customDepartment}
                  onChange={handleCustomInputChange("customDepartment")}
                  placeholder="Enter your department"
                  className="mt-1 block w-full border-2 border-blue-500 rounded-md shadow-sm"
                />
              )}
            </div>
          </form>
          {/* </div> */}
        </Modal.Body>
        <Modal.Footer>
          <button
            onClick={() => setShowModal(false)}
            className="border border-blue-500 hover:bg-blue-500 text-blue-500 font-semibold hover:text-white py-1 px-2 hover:border-transparent rounded"
          >
            Skip
          </button>
          <button
            type="submit"
            className="border border-blue-500 bg-blue-500 text-white font-semibold py-1 px-2 rounded hover:bg-blue-600"
            onClick={handleSubmit} // Only handle form submission here
          >
            Continue
          </button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default Home;
