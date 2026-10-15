import { useState, useEffect } from "react";
import { Button, Card, Container, Row, Col } from "react-bootstrap";
import { useNavigate } from "react-router";
import { useUserAuth } from "../authentication/UserAuthContext";
import { useLocation } from "react-router-dom";
import { db, storage } from "../firebase";
import { doc, getDoc, updateDoc, collection, arrayUnion, arrayRemove, query, where, getDocs, serverTimestamp, writeBatch } from "firebase/firestore";
import { ref, uploadBytes, deleteObject, getDownloadURL } from "firebase/storage";
import { profileAvatar, randomAvatarSeed } from "../utils/avatar";
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
  const [projectError, setProjectError] = useState("");
  const [projectPending, setProjectPending] = useState(false);
  // Combined state object for all fields
  const [fields, setFields] = useState({
    occupation: "",
    experienceLevel: "",
  });
  // New state to track custom input values
  const [customInputs, setCustomInputs] = useState({
    customOccupation: "",
    customExperienceLevel: "",
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
            const profile = docSnap.data();
            setUserProfile(profile);
            setProfileImageUrl(profileAvatar(profile, user.uid));
            setFields(previous => Object.fromEntries(Object.keys(previous).map(key => [key, profile[key] || ""])));
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
        const projectIds = userDocSnap.data()?.projectIds || [];
        if (projectIds && projectIds.length) {
          const projects = [];
          const groups = [];
          for (let i = 0; i < projectIds.length; i += 30) groups.push(projectIds.slice(i, i + 30));
          const snapshots = await Promise.all(groups.map(ids => getDocs(query(collection(db, "projects"), where("uid", "in", ids)))));
          snapshots.forEach(projectDocSnap => projectDocSnap.forEach(doc => {
            const { uid, name, lastUpdatedTime, lastUpdatedBy, snapshotUrl } = doc.data();
            projects.push({
              uid,
              name,
              lastUpdatedTime: lastUpdatedTime?.toDate?.().toLocaleDateString('en-US') || 'Just created',
              lastUpdatedTimeRaw: lastUpdatedTime?.toMillis?.() || 0,
              lastUpdatedBy,
              snapshotUrl: snapshotUrl
            });
          }));
          projects.sort((a, b) => b.lastUpdatedTimeRaw - a.lastUpdatedTimeRaw);

          setProjectsInfo(projects);
        }
      }
    };

    fetchUserProfile();
    fetchProjectData().catch(() => setProjectError("Could not load projects. Check your connection and refresh."));
  }, [user]);

  useEffect(() => {
    // Check if coming from signup with a new user
    if (location.state?.newUser) {
      setShowModal(true);
      navigate(location.pathname, { replace: true, state: { ...location.state, newUser: false } });
    }
  }, [location, navigate]);

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
      setUserProfile(previous => ({ ...previous, profile_picture: imageUrl }));
      await updateDoc(doc(db, "users", user?.uid), { profile_picture: imageUrl });
    } catch (error) {
      console.error("Error during image upload:", error);
    }
  };

  const randomizeProfileImage = async () => {
    if (!user?.uid) return;
    const avatarSeed = randomAvatarSeed();
    try {
      await updateDoc(doc(db, "users", user.uid), { avatarSeed, profile_picture: "" });
      setProfileImageUrl(profileAvatar({ avatarSeed }, user.uid));
      setUserProfile(previous => ({ ...previous, avatarSeed, profile_picture: "" }));
    } catch { setProjectError("Could not save your avatar. Please retry."); }
  };
  const deleteProfileImage = async () => {
    if (!user?.uid) return;
    try {
      await updateDoc(doc(db, "users", user.uid), { profile_picture: "" });
      setProfileImageUrl(profileAvatar({ ...userProfile, profile_picture: "" }, user.uid));
      setUserProfile(previous => ({ ...previous, profile_picture: "" }));
    } catch { setProjectError("Could not remove your profile image. Please retry."); }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    // Check for empty fields
    if (Object.values(fields).some((field) => field === "")) {
      alert("Please fill in all fields.");
      return;
    }

    let finalData = { ...fields };

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
    if (!user?.uid || projectPending) return;
    setProjectPending(true); setProjectError("");
    try {
      const ref = doc(collection(db, "projects"));
      const batch = writeBatch(db);
      batch.set(ref, { uid: ref.id, name: "Untitled project", cards: [], links: [], evaluations: [], personas: [], userIds: [user.uid], lastUpdatedTime: serverTimestamp(), lastUpdatedBy: user.uid, canvasScale: { x: 1.1, y: 1.1 } });
      batch.update(doc(db, "users", user.uid), { projectIds: arrayUnion(ref.id) });
      await batch.commit(); navigate(`/project/${ref.id}`);
    } catch { setProjectError("Could not create a project. Check your connection and retry."); }
    finally { setProjectPending(false); }
  };

  const deleteProject = async (projectId) => {
    if (!window.confirm("Delete this project? This cannot be undone.")) return;
    setProjectError("");
    try {
      const batch = writeBatch(db);
      batch.delete(doc(db, "projects", projectId));
      batch.update(doc(db, "users", user.uid), { projectIds: arrayRemove(projectId) });
      await batch.commit();
      setProjectsInfo(projects => projects.filter(project => project.uid !== projectId));
      await deleteObject(ref(storage, `project_snapshots/${projectId}.png`)).catch(() => {});
    } catch { setProjectError("Could not delete the project. Check your connection and retry."); }
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
              disabled={projectPending} onClick={createProject}>
              {projectPending ? "Creating…" : "+ New Project"}
            </button>
          </div>
          <p className="text-sm text-gray-500 mb-3">
            Project data will be shared publicly in the testing mode.
          </p>

          {projectError && <p role="alert" className="text-red-700">{projectError}</p>}
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
        randomizeProfileImage={randomizeProfileImage}
        profileImageUrl={profileImageUrl}
        handleSubmit={handleSubmit}
      />

      <Footer />
    </>
  );
};

export default Home;
