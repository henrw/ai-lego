import React, { useEffect } from "react";
import Card from "./Card";
import Column from "./Column";
import { useState } from "react";
import useMyStore, { prompts, colorClasses } from "../../contexts/projectContext";
import Xarrow from "react-xarrows";
import { useParams, useLocation } from 'react-router-dom';
import ProblemEvaluation from "./Evaluation/ProblemEvaluation";
import StageEvaluation from "./Evaluation/StageEvaluation";
import PersonaEvaluation from "./Evaluation/PersonaEvaluation";
import CollaboratorModal from "./CollaboratorModal";
import MiniMap from "./MiniMap";
import { useUserAuth } from "../../authentication/UserAuthContext";
import html2canvas from 'html2canvas';

import PersonaIcon from './Persona';


import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

import { db, storage } from "../../firebase"; // Ensure you have this import
import { doc, getDoc, updateDoc, addDoc, deleteDoc, collection, arrayUnion, arrayRemove, query, where, getDocs, serverTimestamp } from "firebase/firestore"; // Import Firestore document update functions

const Canvas = () => {

  const { user, loading } = useUserAuth();
  // Collaborator modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const openModal = () => {
    setIsModalOpen(true);
  };
  const closeModal = () => {
    setIsModalOpen(false);
  };

  const getBgColorClassFromId = (stage) => {
    const bgColorClass = `bg-${colorClasses[stage]}`;
    return bgColorClass;
  };

  const [selectedCardIds, setSelectedCardIds] = useState([]);

  const { projectId } = useParams();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);

  const usp = queryParams.get('usp');
  const linksPath = "smooth";

  const [hovered, setHovered] = useState("");
  const [hoverY, setHoverY] = useState(0);

  const [newPersona, setNewPersona] = useState(false);
  const [candidatePersonas, setCandidatePersonas] = useState([]);
  const [personaInputText, setPersonaInputText] = useState("");


  const [personas, setPersonas] = useState([]);

  const addPersona = async () => {
    var imageRef = ref(
      storage,
      `persona_pictures/boy.png`
    );
    getDownloadURL(imageRef)
      .then((url) => {
        // Update the state with the new URL
        setPersonas([...personas,
          {
            imgUrl: url,
            description: personaInputText,
          }]);
        console.log(personas);

      })
      .catch((error) => {
        console.error("Error fetching the image URL:", error);
        // Handle errors or set a default image perhaps
      });
  }

  // useEffect(() => {
  //   var imageRef = ref(
  //     storage,
  //     `persona_pictures/boy.png`
  //   );
  //   getDownloadURL(imageRef)
  //     .then((url) => {
  //       // Update the state with the new URL
  //       setPersonas([
  //         {
  //           imgUrl: url,
  //           description: 'test',
  //         }
  //       ]);
  //     })
  //     .catch((error) => {
  //       console.error("Error fetching the image URL:", error);
  //       // Handle errors or set a default image perhaps
  //     });
  // }, []); // Empty dependency array means this effect runs once on mount

  const generatePersona = async () => {
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        existingPersonas: personas
      }),
    });

    if (response.ok) {
      const data = await response.json();
      setCandidatePersonas(data.res);
      console.log(data.res);
    } else {
      console.error('Failed to fetch:', response.status);
    }
  };


  const cardsData = useMyStore((store) => store.cards);
  const evaluations = useMyStore((store) => store.evaluations);
  const projectName = useMyStore((store) => store.projectName);
  const links = useMyStore((store) => store.links);

  const addTemplate = useMyStore((store) => store.addTemplate);
  const canvasScale = useMyStore((store) => store.canvasScale);
  const addCardData = useMyStore((store) => store.addCardData);
  const pullProject = useMyStore((store) => store.pullProject);
  const cleanStore = useMyStore((store) => store.cleanStore);
  const setProjectName = useMyStore((store) => store.setProjectName);
  const [isShiftPressed, setIsShiftPressed] = useState(false);

  // Add a function to handle delete action
  const handleDelete = (cardId) => {
    // Call store action to delete the card and associated links
    useMyStore.getState().deleteCardAndLinks(cardId);
  };

  let stage2number = {};
  let cardId2number = {}


  const addCollaborator = async () => {
    console.log(user?.uid);
    try {
      const userId = user?.uid;
      const projectRef = doc(db, "projects", projectId);
      try {
        await updateDoc(projectRef, {
          userIds: arrayUnion(userId)
        });
        const userDocRef = doc(db, "users", userId);
        await updateDoc(userDocRef, {
          projectIds: arrayUnion(projectId)
        });
        console.log("User ID added to project.");
      } catch (error) {
        console.error("Error adding user ID to project: ", error);
      }

    } catch (error) {
      console.error("Error getting documents: ", error);
    }
  };

  useEffect(() => {
    cleanStore(projectId);
    pullProject(projectId);

    if (usp == "sharing") addCollaborator();
    const handleKeyDown = (event) => {
      if (event.key === 'Shift') {
        setIsShiftPressed(true);
      }
    };

    const handleKeyUp = (event) => {
      if (event.key === 'Shift') {
        setIsShiftPressed(false);

      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [pullProject, projectId]);


  const changeSelectedCardIds = (cardId) => {
    setSelectedCardIds(currentSelectedIds => (
      currentSelectedIds.includes(cardId)
        ? (
          isShiftPressed
            ? currentSelectedIds.filter(item => item !== cardId)
            : []
        )
        : (
          isShiftPressed
            ? [...currentSelectedIds, cardId]
            : [cardId]
        )
    )

    );
  };

  function captureElement() {
    const element = document.getElementById("canvas"); // replace 'elementId' with your actual element ID
    return html2canvas(element).then(canvas => {
      return canvas.toDataURL('image/png');
    });

  }

  async function saveImageToFirestore(imageDataURL) {
    const blob = dataURLtoBlob(imageDataURL);
    const downloadUrl = await uploadImageToStorage(blob, `project_snapshots/${projectId}.png`); // _${Date.now() Upload the image to Firebase Storage

    await updateDoc(doc(db, "projects", projectId), {
      snapshotUrl: downloadUrl,
    })
      .then(() => console.log("Document successfully written!"))
      .catch(error => console.error("Error writing document: ", error));
  }

  function saveSnapshot() {
    captureElement().then(imageDataURL => {
      saveImageToFirestore(imageDataURL);
    })
  }

  function dataURLtoBlob(dataurl) {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  }

  const uploadImageToStorage = (fileBlob, path) => {
    const storageRef = ref(storage, path);
    return uploadBytes(storageRef, fileBlob)
      .then((snapshot) => getDownloadURL(snapshot.ref))
      .then((downloadURL) => {
        console.log("File available at", downloadURL);
        return downloadURL; // Return the URL to use it for saving in Firestore or other needs
      });
  };
  useEffect(() => {
    if (cardsData.length !== 0) {
      saveSnapshot();
    }
  }, [cardsData]);

  if (loading) return <div></div>;

  return (
    <>
      {/* // <div className="flex flex-row "> */}
      <div id="canvas" style={{ width: `${canvasScale.x * 100}vw`, height: `${canvasScale.y * 100}vh`, paddingTop: '4rem', position: 'relative' }} className="sketchbook-background">

        {cardsData.map((card) => {
          if (card.stage in stage2number) {
            stage2number[card.stage] += 1;
            cardId2number[card.uid] = stage2number[card.stage];
          }
          else {
            stage2number[card.stage] = 0;
            cardId2number[card.uid] = 0;
          }

          return (
            <Card
              id={card.uid}
              key={card.uid}
              number={stage2number[card.stage]}
              stage={card.stage}
              comments={card.comments}
              handleDelete={handleDelete}
              text={card.description}
              changeSelectedCardIds={changeSelectedCardIds}
              selectedCardIds={selectedCardIds}
            />
          )
        })}

        {links.map((ar, idx) => (
          <Xarrow
            className="arrow"
            path={linksPath}
            headSize={4}
            start={ar.start + "-right"}
            end={ar.end + "-left"}
            startAnchor={"right"}
            endAnchor={"left"}
            key={ar.start + "." + ar.end}
            labels={""}
            zIndex={0}
            color="#9CAFB7"
          />
        ))}
      </div>
      <div className="flex flex-row fixed top-20 left-4 z-10">
        <input
          type="text"
          className="p-2 border-2"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          onBlur={() => { }} // TODO optimize firebase update if necessary
          placeholder="Enter Project Name"
        />
        <button
          onClick={openModal}
          className="ml-1 bg-blue-500 hover:bg-blue-700 text-white py-2 px-3 rounded">
          Share
        </button>
      </div>

      <CollaboratorModal isOpen={isModalOpen} onClose={closeModal} />

      <p className="fixed bottom-[170px] right-6 font-bold text-lg">Evaluation:</p>
      <ProblemEvaluation selectedCardIds={[...selectedCardIds]} number={evaluations.length} cardsData={cardsData} cardId2number={cardId2number} />
      <StageEvaluation selectedCardIds={[...selectedCardIds]} number={evaluations.length} cardsData={cardsData} cardId2number={cardId2number} />
      <PersonaEvaluation selectedCardIds={[]} number={evaluations.length} cardsData={cardsData} cardId2number={cardId2number} />

      <MiniMap />

      <div className="fixed bottom-[50%] transform translate-y-1/2 left-0 mb-4 ml-4 z-10">
        <div className="flex flex-row">
          <div className="flex flex-col">
            <p className="font-bold text-lg">Personas:</p>
            {
              personas.map((persona, index) => (
                <PersonaIcon imgUrl={persona.imgUrl} description={persona.description} />
              ))
            }
            <div className="flex flex-row">
              {
                !newPersona ? <p className="pl-4" style={{ cursor: 'pointer' }} onClick={() => { setNewPersona(true) }}>➕</p> :
                  <div className="bg-white p-3 border border-1 border-gray">
                    <p className="mb-2">Describe a stakeholder that potentially would be negatively impacted by the AI product.</p>
                    <textarea
                      className="no-drag w-full border border-gray-300 p-2 mb-2 rounded"
                      placeholder="Define your persona..."
                      value={personaInputText}
                      onChange={(e) => setPersonaInputText(e.target.value)}
                    />
                    {candidatePersonas.length !== 0 && (
                      candidatePersonas.map(item =>
                        <p
                          onClick={() => { setPersonaInputText(item) }}
                          className="rounded border border-1 border-gray-100 my-1 p-1 hover:bg-blue-100 cursor-pointer">{item}</p>
                      )
                    )}
                    <div className="flex
                     flex-row">
                      <button
                      onClick={()=>{setNewPersona(false); setPersonaInputText("")}}
                      class="hover:bg-gray-100 text-gray-800 font-medium py-2 px-4 border border-gray-400 rounded inline-flex items-center">
                      Close
                      </button>
                      <button
                        onClick={generatePersona}
                        type="button" className="ml-auto focus:outline-none text-white bg-purple-700 hover:bg-purple-800 focus:ring-4 focus:ring-purple-300 font-medium rounded-lg text-sm px-3 py-2.5 dark:bg-purple-600 dark:hover:bg-purple-700 dark:focus:ring-purple-900">Help from AI</button>
                      <button
                        onClick={() => { addPersona(); setNewPersona(false) }}
                        type="button" className="ml-2 text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-3 py-2.5 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800">Save</button>
                    </div>
                  </div>
              }
            </div>
          </div>
          <div
            className={`h-min w-[300px] bg-black text-white text-center fixed left-[110px] z-[1001] transition-opacity duration-300 ${hovered !== "" ? "visible opacity-100" : "invisible opacity-0"}`}
            style={{
              top: `${hoverY}px`
            }}>
            {prompts[hovered]}

          </div>

        </div>
      </div>

      <div className="fixed bottom-0 left-0 mb-4 ml-4 z-10">
        <div className="flex flex-row">
          <div className="flex flex-col">
            <p className="font-bold text-lg">AI LEGO Blocks:</p>
            {
              ["problem", "task", "data", "model", "train", "test", "deploy", "feedback"].map((stage, index) => (
                <button
                  key={index}
                  onClick={() => addCardData(stage)}
                  onMouseEnter={(e) => {
                    const rect = e.target.getBoundingClientRect();
                    const topPosition = rect.top + window.pageYOffset;
                    setHovered(stage);
                    setHoverY(topPosition);
                  }}
                  onMouseLeave={() => {
                    setHovered("");
                  }}
                  className={`w-[90px] p-1 my-1 ${stage === 'problem' ? 'bg-problem' :
                    stage === 'task' ? 'bg-task' :
                      stage === 'data' ? 'bg-data' :
                        stage === 'model' ? 'bg-model' :
                          stage === 'train' ? 'bg-train' :
                            stage === 'test' ? 'bg-test' :
                              stage === 'deploy' ? 'bg-deploy' :
                                stage === 'feedback' ? 'bg-feedback' : 'bg-default'
                    }`}
                >
                  {stage.charAt(0).toUpperCase() + stage.slice(1)}
                </button>
              ))
            }
          </div>
          <div
            className={`h-min w-[300px] bg-black text-white text-center fixed left-[110px] z-[1001] transition-opacity duration-300 ${hovered !== "" ? "visible opacity-100" : "invisible opacity-0"}`}
            style={{
              top: `${hoverY}px`
            }}>
            {prompts[hovered]}
          </div>
        </div>
      </div>
    </>

  );
};

export default Canvas;
