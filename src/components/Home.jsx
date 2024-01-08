// Home.jsx
import React, { useState, useEffect } from "react";
import { Button, Card, Container, Row, Col } from "react-bootstrap";
import { useNavigate } from "react-router";
import { useUserAuth } from "../authentication/UserAuthContext";
import { useLocation } from "react-router-dom";
import { db } from "../firebase"; // Ensure you have this import
import { doc, getDoc, updateDoc } from "firebase/firestore"; // Import Firestore document update functions
import {
  ref,
  uploadBytes,
  deleteObject,
  getDownloadURL,
} from "firebase/storage";
import { storage } from "../firebase";
import ProfileModal from "./ProfileModal"; // Import the ProfileModal component

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

  const cardStyle = {
    boxShadow: "0 4px 8px 0 rgba(0,0,0,0.2)",
    transition: "0.3s",
    borderRadius: "5px",
    backgroundColor: "#f9f9f9", // Lighter background color
    padding: "16px",
  };

  const cardTextStyle = {
    color: "#007bff", // Example text color
    textAlign: "center",
    fontWeight: "bold",
    // Define more styles as needed
  };

  return (
    <>
      {!user && (
        <Container className="pt-20 text-center">
          <h2 style={{ paddingTop: "100px", paddingBottom: "15px" }}>
            Thanks for visiting, Guest!
          </h2>
          <Row className="justify-content-md-center">
            <Button
              onClick={handleLoginRedirect}
              variant="outline-primary"
              style={{ width: "150px" }}
            >
              Log In
            </Button>
          </Row>
        </Container>
      )}

      {user && (
        <Container>
          <h2 style={{ paddingTop: "100px", paddingBottom: "15px" }}>
            Project Management
          </h2>

          <Row className="mb-20">
            <Col md={4}>
              <Card
                onClick={() => navigate("/canvas")}
                style={{ cursor: "pointer" }}
              >
                <Card.Body style={cardStyle}>
                  <Card.Title style={cardTextStyle}>
                    Create New Project
                  </Card.Title>
                  {/* Icon for blank project */}
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card>
                <Card.Body style={cardStyle}>
                  <Card.Title style={cardTextStyle}>
                    Open Existing Project
                  </Card.Title>
                </Card.Body>
              </Card>
            </Col>
          </Row>
          <h2 style={{ paddingBottom: "15px" }}>My Projects</h2>
          <Row className="mb-4">
            {/* Map through projects and create a card for each */}
            <Col md={4}>
              <Card>
                <Card.Body
                  style={{
                    ...cardStyle, // Spread the default card styles
                    backgroundColor: "#b063c5", // Purple background for this specific card
                    // White text for this specific card
                  }}
                >
                  <Card.Title style={{ ...cardTextStyle, color: "white" }}>
                    My New Design System
                  </Card.Title>
                  {/* Other project details */}
                </Card.Body>
              </Card>
            </Col>
            {/* Add more project cards as needed */}
          </Row>
        </Container>
      )}

      <ProfileModal
        showModal={showModal}
        setShowModal={setShowModal}
        handleClose={() => setShowModal(false)}
        userProfile={userProfile}
        handleImageChange={handleImageChange}
        handleFieldChange={handleFieldChange} // Pass this as a prop
        handleCustomInputChange={handleCustomInputChange} // Pass this as a prop
        fields={fields} // Pass this as a prop
        customInputs={customInputs} // Pass this as a prop
        uploadProfileImage={uploadProfileImage}
        deleteProfileImage={deleteProfileImage}
        profileImageUrl={profileImageUrl}
        handleSubmit={handleSubmit}
      />
    </>
  );
};

export default Home;
