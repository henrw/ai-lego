// Home.jsx
import React, { useState, useEffect } from "react";
import { Button, Card, Container, Row, Col } from "react-bootstrap";
import { useNavigate } from "react-router";
import { useUserAuth } from "../authentication/UserAuthContext";
import { useLocation } from "react-router-dom";
import { db } from "../firebase"; // Ensure you have this import
import { doc, getDoc, updateDoc, addDoc, deleteDoc, collection, arrayUnion, arrayRemove, query, where, getDocs, serverTimestamp } from "firebase/firestore"; // Import Firestore document update functions
import {
  ref,
  uploadBytes,
  deleteObject,
  getDownloadURL,
} from "firebase/storage";
import { storage } from "../firebase";
import ProfileModal from "./ProfileModal"; // Import the ProfileModal component
import ThreeDotMenu from "./Canvas/ThreeDotMenu";

const Home = () => {
  const { user } = useUserAuth();
  const navigate = useNavigate();
  const location = useLocation(); // Get location to access state
  const [showModal, setShowModal] = useState(false); // Default to false
  const [userProfile, setUserProfile] = useState({});
  const [projectsInfo, setProjectsInfo] = useState([]);
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

    const fetchProjectData = async () => {
      if (user?.uid) {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        const projectIds = userDocSnap.data().projectIds;
        if (projectIds && projectIds.length) {
          const projects = [];
          const q = query(collection(db, "projects"), where("uid", "in", projectIds));
          const projectDocSnap = await getDocs(q);
          projectDocSnap.forEach(doc => {
            const name = doc.data().name;
            const lastUpdatedTime = doc.data().lastUpdatedTime.toDate().toLocaleDateString('en-US');
            const lastUpdatedTimeRaw = doc.data().lastUpdatedTime;
            const lastUpdatedBy = doc.data().lastUpdatedBy;
            const snapshotUrl = doc.data().snapshotUrl;

            projects.push({ uid: doc.data().uid, name: name, lastUpdatedTime: lastUpdatedTime, lastUpdatedTimeRaw: lastUpdatedTimeRaw, lastUpdatedBy: lastUpdatedBy, snapshotUrl: snapshotUrl || "/project-thumbnail-example.png" });
          });
          // Sorting the projects in the reverse chronological order
          projects.sort((a, b) => b.lastUpdatedTimeRaw - a.lastUpdatedTimeRaw);

          setProjectsInfo(projects);
        }
      }
    };

    fetchUserProfile();
    fetchProjectData();
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

  const createProject = async () => {
    const docRef = await addDoc(collection(db, "projects"), {
      name: "untitled",
      cards: [],
      links: [],
      evaluations: [],
      userIds: [user.uid],
      lastUpdatedTime: serverTimestamp(),
      lastUpdatedBy: user.uid,
      canvasScale: { x: 1.1, y: 1.1 },
    });

    // For quick filtering
    updateDoc(docRef, {
      uid: docRef.id
    });

    updateDoc(doc(db, "users", user.uid), {
      projectIds: arrayUnion(docRef.id)
    });

    navigate(`/project/${docRef.id}`);
  };

  const deleteProject = async (projectId) => {
    const newProjectsInfo = projectsInfo.filter(project => project.uid != projectId);
    setProjectsInfo(newProjectsInfo);
    try {
      await deleteDoc(doc(db, "projects", projectId));
      await updateDoc(doc(db, "users", user.uid), {
        projectIds: arrayRemove(projectId)
      });

      await deleteObject(ref(storage, `project_snapshots/${projectId}`))
      .then(() => {
          console.log('File successfully deleted!');
      })
      .catch((error) => {
          console.error('Error removing file: ', error);
      });
  
    } catch (error) {
      console.error("Error deleting project: ", error);
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
          <div className="flex flex-row items-center" style={{ paddingTop: "100px", paddingBottom: "15px" }}>
            <div className="font-bold text-2xl">
              Projects
            </div>
            <button className="ml-auto text-md rounded p-2 text-white" style={{ backgroundColor: "#b063c5" }}
              onClick={createProject}>
              + New Project
            </button>
          </div>

          <Row className="mb-4">
            {/* Map through projects and create a card for each */}
            {projectsInfo.map((item, index) => (
              // Place the Col component inside the map to ensure each card gets its own column
              <Col md={3} key={index} className="mb-4" onClick={() => { navigate(`/project/${item.uid}`) }} style={{ cursor: 'pointer' }}>
                <Card>
                  <Card.Body style={{ ...cardStyle }}>
                    <Card.Img variant="top" className="h-[150px]" src={item.snapshotUrl} />
                    <Card.Title>{item.name}</Card.Title>
                    <div className="flex flex-row items-center justify-between">
                      <div>Last Updated: {item.lastUpdatedTime}</div>
                      <ThreeDotMenu deleteProject={deleteProject} projectId={item.uid}/>
                    </div>

                    {/* <div>Last Updated By: {item.lastUpdatedBy}</div> */}
                    {/* Other project details */}
                  </Card.Body>
                </Card>
              </Col>
            ))}
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
