import React, { useCallback, useEffect, useRef } from "react";
import Card from "./Card";
import { useState } from "react";
import useMyStore, { prompts } from "../../contexts/projectContext";
import Xarrow from "react-xarrows";
import { useParams, useLocation } from 'react-router-dom';
import StageEvaluation from "./Evaluation/StageEvaluation";
import PersonaEvaluation from "./Evaluation/PersonaEvaluation";
import CollaboratorModal from "./CollaboratorModal";
import MiniMap from "./MiniMap";
import { useUserAuth } from "../../authentication/UserAuthContext";
import html2canvas from 'html2canvas';

import PersonaIcon from './Persona';

import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

import { db, storage } from "../../firebase"; // Ensure you have this import
import { doc, updateDoc, arrayUnion } from "firebase/firestore"; // Import Firestore document update functions

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

  const [apiPending, setApiPending] = useState(false);
  const personaAbortRef = useRef(null);

  const [selectedCardIds, setSelectedCardIds] = useState([]);

  const { projectId } = useParams();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);

  const usp = queryParams.get('usp');
  const linksPath = "smooth";

  const [hovered, setHovered] = useState("");

  const [newPersona, setNewPersona] = useState(false);
  const [candidatePersonas, setCandidatePersonas] = useState([]);
  const [personaInputText, setPersonaInputText] = useState("");
  const personaInputTextRef = useRef(null);

  const setPersonaInputTextWrapper = (text) => {
    setPersonaInputText(text);
    personaInputTextRef.current.style.height = "auto";
    personaInputTextRef.current.style.height = personaInputTextRef.current.scrollHeight + "px";
  }

  const [isPersonaEvaluationExpanded, setIsPersonaEvaluationExpanded] = useState(false);
  const [isStageEvaluationExpanded, setIsStageEvaluationExpanded] = useState(false);
  const [isProblemEvaluationExpanded] = useState(false);

  const [personas, setPersonas] = useState([]);
  const [lastSelectedPersonaIndex, setLastSelectedPersonaIndex] = useState(null);

  const [personaImgIdx, setPersonaImgIdx] = useState(0);
  const personaImgUrls = [
    "https://firebasestorage.googleapis.com/v0/b/ai-lego.appspot.com/o/persona_pictures%2Fboy.png?alt=media&token=8a12acfa-25f2-44a9-90f4-ef407aeff3dc",
    "https://firebasestorage.googleapis.com/v0/b/ai-lego.appspot.com/o/persona_pictures%2Fboy1.png?alt=media&token=dc0961de-51f1-43ba-9d4d-e3b8ae999a35",
    "https://firebasestorage.googleapis.com/v0/b/ai-lego.appspot.com/o/persona_pictures%2Fgirl.png?alt=media&token=cee9ed5a-72ce-4855-bd0a-abba8014d0fb",
    "https://firebasestorage.googleapis.com/v0/b/ai-lego.appspot.com/o/persona_pictures%2Fgrandma.png?alt=media&token=62911dc9-8cbf-48ff-b1e5-ceb1a186f323",
    "https://firebasestorage.googleapis.com/v0/b/ai-lego.appspot.com/o/persona_pictures%2Fgrandpa.png?alt=media&token=c12f735a-71e3-44d0-a59f-897cf5b83be4",
    "https://firebasestorage.googleapis.com/v0/b/ai-lego.appspot.com/o/persona_pictures%2Fman.png?alt=media&token=92fed1b8-75a9-4b2b-8f4a-febd7d76c506",
    "https://firebasestorage.googleapis.com/v0/b/ai-lego.appspot.com/o/persona_pictures%2Fneutral.png?alt=media&token=3523e99c-1ddb-4fe6-82ad-7fd0feae778d",
    "https://firebasestorage.googleapis.com/v0/b/ai-lego.appspot.com/o/persona_pictures%2Fwoman.png?alt=media&token=f74c9d68-b0f2-4d4c-8ecd-fcb76e3122eb"
  ]

  const addPersona = async () => {
    setPersonas([...personas,
    {
      imgUrl: personaImgUrls[personaImgIdx],
      description: personaInputText,
      isSelected: false
    }]);
    console.log(personas);
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

  const removeEnumerators = (text) => text.replace(/^(?:\d+\.\s+|-\s+)/gm, "");

  const parsePersonasFromXml = (text) => {
    const matches = [...text.matchAll(/<persona>([\s\S]*?)<\/persona>/g)];
    if (matches.length === 0) {
      return [];
    }
    return matches
      .map((match) => match[1].replace(/<[^>]+>/g, "").trim())
      .filter((item) => item !== "");
  };

  const finalizePersonaCandidates = (text) => {
    const parsed = parsePersonasFromXml(text);
    const cleaned = parsed.length > 0
      ? parsed
      : removeEnumerators(text)
          .split("\n")
          .map((item) => item.trim())
          .filter((item) => item !== "");
    setCandidatePersonas(cleaned);
  };

  const stopPersonaGeneration = () => {
    if (personaAbortRef.current) {
      personaAbortRef.current.abort();
      personaAbortRef.current = null;
    }
    setApiPending(false);
  };

  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || "";

  const generatePersona = async () => {
    if (apiPending) return;
    setCandidatePersonas([]);
    setApiPending(true);
    const controller = new AbortController();
    personaAbortRef.current = controller;

    try {
      const response = await fetch(`${apiBaseUrl}/api/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          existingPersonas: personas,
          cardsData,
        }),
        signal: controller.signal,
      });

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data.res)) {
          setCandidatePersonas(data.res);
        } else {
          finalizePersonaCandidates(data.res || "");
        }
      } else {
        console.error("Failed to fetch:", response.status);
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("Failed to fetch:", error);
      }
    } finally {
      setApiPending(false);
      personaAbortRef.current = null;
    }
  };


  const cardsData = useMyStore((store) => store.cards);
  const evaluations = useMyStore((store) => store.evaluations);
  const projectName = useMyStore((store) => store.projectName);
  const links = useMyStore((store) => store.links);

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


  const addCollaborator = useCallback(async () => {
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
  }, [projectId, user?.uid]);

  useEffect(() => {
    cleanStore(projectId);
    pullProject(projectId);

    if (usp === "sharing") addCollaborator();
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
  }, [addCollaborator, cleanStore, pullProject, projectId, usp]);


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

  function togglePersonaSelection(idx) {
    const newPersonas = personas.map((persona, i) => ({
      ...persona,
      isSelected: i === idx ? !persona.isSelected : false,
    }));
    if (newPersonas[idx].isSelected) {
      setLastSelectedPersonaIndex(idx);
    }
    setPersonas(newPersonas);
  }

  useEffect(() => {
    if (!isPersonaEvaluationExpanded) return;
    if (personas.length === 0) return;
    if (personas.some((persona) => persona.isSelected)) return;
    if (lastSelectedPersonaIndex === null) return;
    if (!personas[lastSelectedPersonaIndex]) return;
    setPersonas((prev) =>
      prev.map((persona, i) => ({
        ...persona,
        isSelected: i === lastSelectedPersonaIndex,
      }))
    );
  }, [isPersonaEvaluationExpanded, lastSelectedPersonaIndex, personas]);

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

  const uploadImageToStorage = useCallback((fileBlob, path) => {
    const storageRef = ref(storage, path);
    return uploadBytes(storageRef, fileBlob)
      .then((snapshot) => getDownloadURL(snapshot.ref))
      .then((downloadURL) => {
        console.log("File available at", downloadURL);
        return downloadURL; // Return the URL to use it for saving in Firestore or other needs
      });
  }, []);

  const saveImageToFirestore = useCallback(async (imageDataURL) => {
    const blob = dataURLtoBlob(imageDataURL);
    const downloadUrl = await uploadImageToStorage(blob, `project_snapshots/${projectId}.png`); // _${Date.now() Upload the image to Firebase Storage

    await updateDoc(doc(db, "projects", projectId), {
      snapshotUrl: downloadUrl,
    })
      .then(() => console.log("Document successfully written!"))
      .catch(error => console.error("Error writing document: ", error));
  }, [projectId, uploadImageToStorage]);

  const saveSnapshot = useCallback(() => {
    captureElement().then((imageDataURL) => {
      saveImageToFirestore(imageDataURL);
    });
  }, [saveImageToFirestore]);
  useEffect(() => {
    if (cardsData.length !== 0) {
      saveSnapshot();
    }
  }, [cardsData, saveSnapshot]);

  if (loading) return <div></div>;

  return (
    <>
      {/* // <div className="flex flex-row "> */}
      <div onClick={()=>{setSelectedCardIds([]);}}
      id="canvas" style={{ width: `${canvasScale.x * 100}vw`, height: `${canvasScale.y * 100}vh`, paddingTop: '4rem', position: 'relative' }} className="sketchbook-background">

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
          className="py-2 pl-2 pr-1 border-2"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          onBlur={() => { }} // TODO optimize firebase update if necessary
          placeholder="Enter Project Name"
          size={Math.min(Math.max(projectName.length, 16), 60)}
        />
        <button
          onClick={openModal}
          className="ml-1 bg-blue-500 hover:bg-blue-700 text-white py-2 px-3 rounded">
          Share
        </button>
      </div>

      <CollaboratorModal isOpen={isModalOpen} onClose={closeModal} />

      <p className="fixed bottom-[125px] right-6 font-bold text-lg z-10">Evaluation:</p>
      {/* <ProblemEvaluation isExpanded={isProblemEvaluationExpanded} setIsExpanded={setIsProblemEvaluationExpanded} selectedCardIds={[...selectedCardIds]} number={evaluations.length} cardsData={cardsData} cardId2number={cardId2number} /> */}
      <StageEvaluation isExpanded={isStageEvaluationExpanded} setIsExpanded={setIsStageEvaluationExpanded} selectedCardIds={[...selectedCardIds]} number={evaluations.length} cardsData={cardsData} cardId2number={cardId2number} />
      <PersonaEvaluation isExpanded={isPersonaEvaluationExpanded} setIsExpanded={setIsPersonaEvaluationExpanded} number={evaluations.length} cardsData={cardsData} cardId2number={cardId2number} selectedPersona={personas.filter(item => item.isSelected === true)} />

      <MiniMap />

      <div className={`fixed top-20 ${(isProblemEvaluationExpanded || isStageEvaluationExpanded || isPersonaEvaluationExpanded) ? "right-[400px]" : "right-2"} mb-4 ml-4 z-10`}>
        <div className="flex flex-row">
          <p className="font-bold text-lg mr-2">Personas:</p>
          <div className="ml-auto flex flex-row fixed relative">
            {
              !newPersona ? <button type="button" onClick={() => { setNewPersona(true) }} className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-2 py-1 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800">Create</button> : null
            }
          </div>
        </div>
        <div className="flex flex-row justify-end">
          {
            personas.map((persona, index) => (
              <PersonaIcon imgUrl={persona.imgUrl} description={persona.description} isSelected={persona.isSelected} toggleFunction={togglePersonaSelection} idx={index} />
            ))
          }

        </div>
      </div>

      {newPersona && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-4xl max-h-[85vh] overflow-y-auto rounded-xl bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Create Persona</h3>
              <button
                onClick={() => { setNewPersona(false); setPersonaInputTextWrapper(""); }}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close persona dialog"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="mt-5 flex justify-center">
              <div className="flex p-2 justify-center rounded-full bg-blue-200 w-[120px] h-[120px] relative">
                <img src={personaImgUrls[personaImgIdx]} alt="persona lego" style={{ objectFit: "contain" }} className="" />
                <svg onClick={() => { setPersonaImgIdx((personaImgIdx + 1) % personaImgUrls.length) }}
                  className="absolute cursor-pointer bottom-1 right-1" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.7274 7.92943C17.2484 6.14165 16.1643 4.57528 14.6598 3.49721C13.1554 2.41914 11.3236 1.89606 9.47677 2.01711C7.62989 2.13816 5.88212 2.89585 4.53125 4.16107C3.18039 5.42629 2.31002 7.12077 2.06843 8.95577C1.82685 10.7908 2.22901 12.6528 3.20638 14.2245C4.18375 15.7963 5.67586 16.9805 7.42848 17.5754C9.1811 18.1704 11.0858 18.1392 12.818 17.4872C14.5502 16.8353 16.0028 15.6029 16.9282 14" stroke="black" strokeWidth="2" strokeLinejoin="round" />
                  <path d="M19.0353 4.13629L18 8L14.1363 6.96472" stroke="black" strokeWidth="2" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
            <p className="my-4 text-sm text-gray-700">
              Describe a stakeholder who might potentially be negatively impacted by the AI product.
            </p>
            <textarea
              ref={personaInputTextRef}
              className="no-drag w-full border border-gray-300 p-3 mb-3 text-sm"
              placeholder="Describe your persona..."
              value={personaInputText}
              onChange={(e) => setPersonaInputTextWrapper(e.target.value)}
            />
                  {apiPending && (
                    <p className="mb-2 text-sm text-gray-500">
                      Generating personas... you can keep editing while this runs.
                    </p>
                  )}
            {candidatePersonas.length !== 0 && (
              <div>
                {candidatePersonas.map(item => (
                  <p
                    key={item}
                    onClick={() => { setPersonaInputTextWrapper(item); }}
                    className="rounded border border-gray-100 my-1 p-1 text-xs hover:bg-blue-100 cursor-pointer"
                  >
                    {item}
                  </p>
                ))}
              </div>
            )}
            <div className="mt-3 flex flex-row">
              <button
                onClick={() => { setNewPersona(false); setPersonaInputTextWrapper(""); }}
                className="hover:bg-gray-100 text-gray-800 font-medium rounded-lg text-sm px-4 py-2.5 border border-gray-400"
              >
                Close
              </button>
              <button
                onClick={generatePersona}
                type="button"
                disabled={apiPending}
                className="ml-auto focus:outline-none text-white bg-purple-700 hover:bg-purple-800 focus:ring-4 focus:ring-purple-300 font-medium rounded-lg text-sm px-4 py-2.5 disabled:opacity-60 disabled:cursor-not-allowed dark:bg-purple-600 dark:hover:bg-purple-700 dark:focus:ring-purple-900"
              >
                {apiPending ? "Generating..." : `${candidatePersonas.length === 0 ? "G" : "Reg"}enerate with AI`}
              </button>
              {apiPending && (
                <button
                  onClick={stopPersonaGeneration}
                  type="button"
                  className="ml-2 text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none font-medium rounded-lg text-sm px-4 py-2.5"
                >
                  Stop
                </button>
              )}
              <button
                onClick={() => { addPersona(); setPersonaInputTextWrapper(""); setNewPersona(false) }}
                type="button"
                className="ml-2 text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2.5 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 mb-4 ml-4 z-10">
        <div className="flex flex-row">
          <div className="flex flex-col">
            {/* <div className="relative mb-[1000px]">
                <button
                  key="note-button"
                  onClick={() => addCardData("note")}
                  className={`w-[90px] p-1 my-1 bg-gray-200`}
                >
                  {"note".charAt(0).toUpperCase() + "note".slice(1)}
                </button>
              </div> */}
            <p className="font-bold text-lg mb-2">AI LEGO Blocks:</p>
            {
              ["problem", "task", "data", "model", "train", "test", "deploy", "feedback"].map((stage, index) => (
                <div className="relative">
                  <button
                    key={index}
                    onClick={() => addCardData(stage)}
                    onMouseEnter={(e) => {
                      setHovered(stage);
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
                  <div
                    className={`absolute text-sm h-min ${index===7?"w-[500px]":"w-[300px]"} bg-black text-white text-left pl-2 left-[90px] transform -translate-y-[36px] z-[30] transition-opacity duration-300 whitespace-pre-wrap ${hovered === stage ? "visible opacity-100" : "invisible opacity-0"}`}>
                    {prompts[hovered]}
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      </div>
    </>

  );
};

export default Canvas;
