import { useState, useEffect } from "react";
import { Button, Card, Container, Row, Col } from "react-bootstrap";
import { useNavigate } from "react-router";
import { useUserAuth } from "../authentication/UserAuthContext";
import { useLocation } from "react-router-dom";
import { db, storage } from "../firebase";
import { doc, getDoc, updateDoc, addDoc, deleteDoc, collection, arrayUnion, arrayRemove, query, where, getDocs, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, deleteObject, getDownloadURL } from "firebase/storage";
import ProfileModal from "./ProfileModal";
import Footer from "./Footer";
import ThreeDotMenu from "./Canvas/ui/ThreeDotMenu";

const Home = () => {
  const { user } = useUserAuth();
  const navigate = useNavigate();
  const location = useLocation(); // Get location to access state
  const [showModal, setShowModal] = useState(false);
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
        const userDocRef = doc(db, "users", user.uid);
        try {
          const docSnap = await getDoc(userDocRef);
          if (docSnap.exists()) {
            setUserProfile(docSnap.data());
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
            const { uid, name, lastUpdatedTime, lastUpdatedBy, snapshotUrl } = doc.data();
            projects.push({
              uid,
              name,
              lastUpdatedTime: lastUpdatedTime.toDate().toLocaleDateString('en-US'),
              lastUpdatedTimeRaw: lastUpdatedTime,
              lastUpdatedBy,
              snapshotUrl: snapshotUrl
            });
          });
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
    if (e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const uploadProfileImage = async () => {
    if (!selectedFile) return;
    try {
      const storageRef = ref(storage, `profile_pictures/${user?.uid}/${selectedFile.name}`);
      await uploadBytes(storageRef, selectedFile);
      const imageUrl = await getDownloadURL(storageRef);
      setProfileImageUrl(imageUrl);
      await updateDoc(doc(db, "users", user?.uid), { profile_picture: imageUrl });
    } catch (error) {
      console.error("Error during image upload:", error);
    }
  };

  const deleteProfileImage = async () => {
    if (!selectedFile) return;
    try {
      const storageRef = ref(storage, `profile_pictures/${user?.uid}/${selectedFile.name}`);
      await deleteObject(storageRef);
      setProfileImageUrl("");
      await updateDoc(doc(db, "users", user?.uid), { profile_picture: null });
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

    let finalData = { ...fields, profile_picture: profileImageUrl };

    // Replace "Other" fields with custom input values
    Object.keys(fields).forEach((field) => {
      const customKey = `custom${field.charAt(0).toUpperCase() + field.slice(1)}`;
      if (fields[field] === "Other" && customInputs[customKey]) {
        finalData[field] = customInputs[customKey];
      }
    });

    if (user) {
      try {
        await updateDoc(doc(db, "users", user.uid), finalData);
        setShowModal(false);
      } catch (error) {
        console.error("Error updating document: ", error);
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

    updateDoc(docRef, { uid: docRef.id });
    updateDoc(doc(db, "users", user.uid), { projectIds: arrayUnion(docRef.id) });
    navigate(`/project/${docRef.id}`);
  };

  const deleteProject = async (projectId) => {
    const newProjectsInfo = projectsInfo.filter(project => project.uid !== projectId);
    setProjectsInfo(newProjectsInfo);
    try {
      await deleteDoc(doc(db, "projects", projectId));
      await updateDoc(doc(db, "users", user.uid), {
        projectIds: arrayRemove(projectId)
      });

      await deleteObject(ref(storage, `project_snapshots/${projectId}`)).catch((error) => {
        console.error('Error removing snapshot: ', error);
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
          <p className="text-sm text-gray-500 mb-3">
            Project data will be shared publicly in the testing mode.
          </p>

          <Row className="mb-4">
            {projectsInfo.map((item, index) => (
              <Col md={3} key={index} className="mb-4" onClick={() => navigate(`/project/${item.uid}`)} style={{ cursor: 'pointer' }}>
                <Card>
                  <Card.Body style={{ ...cardStyle }}>
                    <Card.Img variant="top" className="h-[150px]" src={item.snapshotUrl} />
                    <Card.Title>{item.name}</Card.Title>
                    <div className="flex flex-row items-center justify-between">
                      <div>Last Updated: {item.lastUpdatedTime}</div>
                      <ThreeDotMenu deleteProject={deleteProject} projectId={item.uid} />
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      )}

      <ProfileModal
        showModal={showModal}
        setShowModal={setShowModal}
        handleClose={() => setShowModal(false)}
        userProfile={userProfile}
        handleImageChange={handleImageChange}
        handleFieldChange={handleFieldChange}
        handleCustomInputChange={handleCustomInputChange}
        fields={fields}
        customInputs={customInputs}
        uploadProfileImage={uploadProfileImage}
        deleteProfileImage={deleteProfileImage}
        profileImageUrl={profileImageUrl}
        handleSubmit={handleSubmit}
      />

      <Footer />
    </>
  );
};

export default Home;
