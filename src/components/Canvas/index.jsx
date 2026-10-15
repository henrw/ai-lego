import { openAIKeyHeaders } from '../../utils/openAIKey';
import { v4 as uuid } from "uuid";
import useAccountRole from "../../utils/useAccountRole";
import useDraft from "../../utils/useDraft";
import useSessionState from "../../utils/useSessionState";
import React, { useCallback, useEffect, useRef, useState } from "react";
import Block from "./Block";
import useMyStore, { prompts, isNoteCard } from "../../contexts/projectContext";
import CanvasTrace from "./Workbench/CanvasTrace";
import BrickConnections from "./BrickConnections";
import { BOARD_TOP, reflowBricks } from "./brickGeometry";
import { useParams } from 'react-router-dom';
import StageEvaluation from "./Evaluation/StageEvaluation";
import PersonaEvaluation from "./Evaluation/PersonaEvaluation";
import ProfileFields from "./Workbench/ProfileFields";
import { emptyProfile } from "../../utils/workbench";
import CollaboratorModal from "./ui/CollaboratorModal";
import useCanvasGestures from './useCanvasGestures';
import MiniMap from "./ui/MiniMap";
import ProjectNotes from "./ui/ProjectNotes";
import ProjectName from "./ui/ProjectName";
import { useUserAuth } from "../../authentication/UserAuthContext";
import { projectThumbnail } from './projectThumbnail';

import PersonaIcon from './ui/Persona';

import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

import { db, storage } from "../../firebase";
import { doc, updateDoc } from "firebase/firestore";

const Canvas = () => {

  const isDemo = window.location.pathname === "/demo";
  const { user, loading } = useUserAuth();
  const { role, showLifecycle, showEvaluation, evaluationSide, roleLoading, roleError } = useAccountRole(user, isDemo);
  const isReviewer = role === "reviewer";
  // Collaborator modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const openModal = () => {
    setIsModalOpen(true);
  };
  const closeModal = () => {
    setIsModalOpen(false);
  };

  const [apiPending, setApiPending] = useState(false);
  const [personaApiError, setPersonaApiError] = useState("");
  const personaAbortRef = useRef(null);

  const [selectedCardIds, setSelectedCardIds] = useState([]);

  const { projectId } = useParams();
  const [dragPositions, setDragPositions] = useState({});
  const { zoom: viewportZoom, panning } = useCanvasGestures();
  const [brickSizes, setBrickSizes] = useState({});
  const onBrickSize = useCallback((id, size) => setBrickSizes(current => current[id]?.height === size.height && current[id]?.width === size.width ? current : { ...current, [id]: size }), []);
  const [dockPreview, setDockPreview] = useState(null);
  const [clipSourceId, setClipSourceId] = useState(null);
  const [connectorDrag, setConnectorDrag] = useState(null);
  const [clipMessage, setClipMessage] = useState("");
  const connectorPoint = event => {
    const bounds = document.getElementById('canvas').getBoundingClientRect();
    return { x: (event.clientX - bounds.left) / viewportZoom, y: (event.clientY - bounds.top) / viewportZoom - BOARD_TOP };
  };
  const onConnectorDragStart = (id, event) => {
    if (isReviewer) return;
    setClipSourceId(null); setClipMessage('');
    setConnectorDrag({ sourceId: id, point: connectorPoint(event), targetId: null });
  };
  const onConnectorDragOver = event => {
    if (!connectorDrag || isReviewer) return;
    event.preventDefault(); event.dataTransfer.dropEffect = 'link';
    const targetId = event.target.closest?.('.lego-brick')?.id;
    const target = useMyStore.getState().cards.find(card => card.uid === targetId && card.uid !== connectorDrag.sourceId && card.stage !== 'note');
    setConnectorDrag({ ...connectorDrag, point: connectorPoint(event), targetId: target?.uid || null });
  };
  useEffect(() => { setConnectorDrag(null); }, [projectId, role]);
  const onMoveBrick = (id, position) => setDragPositions(current => {
    const next = { ...current };
    if (position) next[id] = position; else delete next[id];
    return next;
  });
  const onClip = id => {
    if (useMyStore.getState().cards.find(card => card.uid === id)?.stage === "note") return;
    if (!clipSourceId) { setClipSourceId(id); setClipMessage("Choose another brick to attach. Esc cancels."); }
    else if (clipSourceId === id) { setClipSourceId(null); setClipMessage(""); }
    else {
      useMyStore.getState().addLink({ start: clipSourceId, end: id });
      setClipSourceId(null); setClipMessage("Bricks connected.");
    }
  };

  const [hovered, setHovered] = useState("");

  const personaSessionKey = `persona-session-${isDemo ? "demo" : projectId}`;
  const [newPersona, setNewPersona] = useSessionState(`${personaSessionKey}-open`, false);
  const [candidatePersonas, setCandidatePersonas] = useSessionState(`${personaSessionKey}-candidates`, []);
  const [personaInputText, setPersonaInputText, clearPersonaInput] = useDraft(`persona-draft-${isDemo ? "demo" : window.location.pathname}`);
  const personaInputTextRef = useRef(null);

  const setPersonaInputTextWrapper = (text) => {
    setPersonaInputText(text);
    if (personaInputTextRef.current?.tagName === "TEXTAREA") {
      personaInputTextRef.current.style.height = "auto";
      personaInputTextRef.current.style.height = personaInputTextRef.current.scrollHeight + "px";
    }
  }

  const [isPersonaEvaluationExpanded, setIsPersonaEvaluationExpanded] = useState(false);
  const [isStageEvaluationExpanded, setIsStageEvaluationExpanded] = useState(false);
  const [isProblemEvaluationExpanded] = useState(false);

  const savedPersonas = useMyStore(store => store.personas);
  const [selectedPersonaId, setSelectedPersonaId] = useSessionState(`${personaSessionKey}-selected`, null);
  const personas = savedPersonas.map(persona => ({ ...persona, isSelected: persona.uid === selectedPersonaId }));
  const personaSubmissionRef = useRef(null);
  const [lastSelectedPersonaIndex, setLastSelectedPersonaIndex] = useState(null);

  const [personaModel, setPersonaModel] = useSessionState(`${personaSessionKey}-model`, "gpt-6.1-sol");
  const [personaMode, setPersonaMode] = useSessionState(`${personaSessionKey}-mode`, "workbench");
  const [personaProfile, setPersonaProfile] = useSessionState(`${personaSessionKey}-profile`, emptyProfile());
  const [personaImgIdx, setPersonaImgIdx] = useSessionState(`${personaSessionKey}-image`, 0);
  const personaImgUrls = [
    "https://firebasestorage.googleapis.com/v0/b/ai-lego.appspot.com/o/persona_pictures%2FSubject%205.png?alt=media",
    "https://firebasestorage.googleapis.com/v0/b/ai-lego.appspot.com/o/persona_pictures%2FSubject%206.png?alt=media",
    "https://firebasestorage.googleapis.com/v0/b/ai-lego.appspot.com/o/persona_pictures%2FSubject%207.png?alt=media",
    "https://firebasestorage.googleapis.com/v0/b/ai-lego.appspot.com/o/persona_pictures%2FSubject%208.png?alt=media"
  ]

  const addPersona = async () => {
    if (!personaInputText.trim()) return false;
    personaSubmissionRef.current ||= `persona-${uuid()}`;
    const ok = await useMyStore.getState().addPersona({ uid: personaSubmissionRef.current, imgUrl: personaImgUrls[personaImgIdx], description: personaInputText.trim(), ...(personaMode === "workbench" ? { profile: personaProfile } : {}) });
    if (ok) { personaSubmissionRef.current = null; clearPersonaInput(); setPersonaProfile(emptyProfile()); }
    else setPersonaApiError("Could not save this persona. Your draft is retained; retry saving.");
    return ok;
  };

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

  useEffect(() => () => personaAbortRef.current?.abort(), [isDemo, projectId]);

  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || "";

  const generatePersona = async () => {
    if (apiPending) return;
    setPersonaApiError("");
    setCandidatePersonas([]);
    setApiPending(true);
    const controller = new AbortController();
    personaAbortRef.current = controller;
    const timeout = setTimeout(() => controller.abort("timeout"), 55000);

    try {
      const response = await fetch(`${apiBaseUrl}/api/${personaMode === "classic" ? "generate" : "workbench"}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json", ...openAIKeyHeaders(user?.uid),
        },
        body: JSON.stringify({
          action: "personas",
          model: personaModel,
          projectName,
          existingPersonas: personas,
          cardsData,
        }),
        signal: controller.signal,
      });

      if (response.ok) {
        const data = await response.json();
        if (personaAbortRef.current !== controller) return;
        if (personaMode === "workbench") {
          if (!Array.isArray(data.result?.personas)) throw new Error("Invalid profile response. Please retry.");
          setCandidatePersonas(data.result.personas);
          if (data.result.personas[0]) {
            setPersonaInputTextWrapper(data.result.personas[0].description);
            setPersonaProfile(data.result.personas[0].profile);
          }
        } else if (Array.isArray(data.res)) {
          setCandidatePersonas(data.res);
        } else {
          finalizePersonaCandidates(data.res || "");
        }
      } else {
        const data = await response.json().catch(() => ({}));
        setPersonaApiError(data.error || "OpenAI could not generate personas. Please try again.");
      }
    } catch (error) {
      if (controller.signal.reason === "timeout") setPersonaApiError("The request timed out. Please retry.");
      else if (error.name !== "AbortError") {
        console.error("Failed to fetch:", error);
        setPersonaApiError("The request could not be completed. Check your connection and try again.");
      }
    } finally {
      clearTimeout(timeout);
      if (personaAbortRef.current === controller) { setApiPending(false); personaAbortRef.current = null; }
    }
  };


  const cardsData = useMyStore((store) => store.cards).filter(card => !isNoteCard(card));
  const evaluations = useMyStore((store) => store.evaluations);
  const projectName = useMyStore((store) => store.projectName);
  const links = useMyStore((store) => store.links);

  const canvasScale = useMyStore((store) => store.canvasScale);
  const addCardData = useMyStore((store) => store.addCardData);
  const openProject = useMyStore((store) => store.openProject);
  const loadingProject = useMyStore(store => store.loadingProject);
  const loadError = useMyStore(store => store.loadError);
  const saveError = useMyStore(store => store.saveError);
  const saveStatus = useMyStore(store => store.saveStatus);
  const [isShiftPressed, setIsShiftPressed] = useState(false);

  // Add a function to handle delete action
  const handleDelete = (cardId) => {
    if (clipSourceId === cardId) { setClipSourceId(null); setClipMessage(""); }
    // Call store action to delete the card and associated links
    useMyStore.getState().deleteCardAndLinks(cardId);
  };

  let stage2number = {};
  let cardId2number = {}


  useEffect(() => {
    const unsubscribe = openProject(projectId, isDemo);
    setSelectedCardIds([]); setLastSelectedPersonaIndex(null); setClipSourceId(null); setClipMessage(""); setDragPositions({}); setDockPreview(null);
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') { setConnectorDrag(null); setClipSourceId(null); setClipMessage(""); }
      if (event.key === 'Shift') {
        setIsShiftPressed(true);
      }
    };

    const handleKeyUp = (event) => {
      if (event.key === 'Shift') {
        setIsShiftPressed(false);

      }
    };

    const resetShift = () => setIsShiftPressed(false);
    window.addEventListener('blur', resetShift);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      unsubscribe();
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', resetShift);
    };
  }, [openProject, projectId, isDemo]);


  const changeSelectedCardIds = (cardId) => {
    if (isReviewer || isStageEvaluationExpanded) {
      setNewPersona(false); setSelectedCardIds([cardId]); setIsStageEvaluationExpanded(true); setIsPersonaEvaluationExpanded(false);
      return;
    }
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

  const captureElement = useCallback(() => projectThumbnail(reflowBricks(cardsData.map(card => ({ ...card, ...brickSizes[card.uid] }))), links), [cardsData, brickSizes, links]);


  function togglePersonaSelection(idx) {
    const persona = personas[idx];
    if (!persona) return;
    if (isReviewer) {
      setNewPersona(false); setSelectedPersonaId(persona.uid); setIsPersonaEvaluationExpanded(true); setIsStageEvaluationExpanded(false);
    } else setSelectedPersonaId(selectedPersonaId === persona.uid ? null : persona.uid);
    setLastSelectedPersonaIndex(idx);
  }

  useEffect(() => {
    if (!isPersonaEvaluationExpanded) return;
    if (personas.length === 0) return;
    if (personas.some((persona) => persona.isSelected)) return;
    if (lastSelectedPersonaIndex === null) return;
    if (!personas[lastSelectedPersonaIndex]) return;
    setSelectedPersonaId(personas[lastSelectedPersonaIndex].uid);
  }, [isPersonaEvaluationExpanded, lastSelectedPersonaIndex, personas, setSelectedPersonaId]);

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
      .then((snapshot) => getDownloadURL(snapshot.ref));
  }, []);

  const saveImageToFirestore = useCallback(async (imageDataURL) => {
    const blob = dataURLtoBlob(imageDataURL);
    const downloadUrl = await uploadImageToStorage(blob, `project_snapshots/${projectId}.png`);
    try {
      await updateDoc(doc(db, "projects", projectId), { snapshotUrl: downloadUrl });
    } catch (error) {
      console.error("Error saving snapshot: ", error);
    }
  }, [projectId, uploadImageToStorage]);

  const snapshotRunningRef = useRef(false);
  const lastSnapshotRef = useRef("");
  const snapshotProjectRef = useRef(projectId);
  snapshotProjectRef.current = projectId;
  useEffect(() => {
    if (isDemo || loadingProject || !projectId || !cardsData.length) return;
    const signature = JSON.stringify(cardsData.map(card => ({ uid: card.uid, description: card.description, position: card.position })));
    if (lastSnapshotRef.current === signature) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      if (snapshotRunningRef.current) return;
      snapshotRunningRef.current = true;
      try {
        const imageDataURL = await captureElement();
        if (!cancelled && snapshotProjectRef.current === projectId) {
          await saveImageToFirestore(imageDataURL);
          lastSnapshotRef.current = signature;
        }
      } catch (error) { console.error("Could not save project preview:", error); }
      finally { snapshotRunningRef.current = false; }
    }, 2500);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [cardsData, loadingProject, projectId, isDemo, saveImageToFirestore, captureElement]);

  const layoutCards = reflowBricks(cardsData.map(card => ({ ...card, ...brickSizes[card.uid] })));
  const layoutById = new Map(layoutCards.map(card => [card.uid, card]));
  const layoutBottom = Math.max(0, ...layoutCards.map(card => card.position.y + (card.height || 110))) + BOARD_TOP + 80;

  useEffect(() => {
    let frame;
    const expand = () => {
      const state = useMyStore.getState();
      const viewportWidth = window.innerWidth / viewportZoom, viewportHeight = window.innerHeight / viewportZoom;
      const extentCards = reflowBricks(cardsData.map(card => ({ ...card, ...brickSizes[card.uid] })));
      const right = Math.max(0, ...extentCards.map(card => card.position.x + (card.width || 240)));
      const bottom = Math.max(0, ...extentCards.map(card => card.position.y + (card.height || 110))) + BOARD_TOP;
      const x = Math.max(state.canvasScale.x, Math.ceil((right + viewportWidth) / window.innerWidth), Math.ceil(2 / viewportZoom), window.scrollX / viewportZoom + viewportWidth * 1.5 > state.canvasScale.x * window.innerWidth ? Math.ceil((window.scrollX / viewportZoom + viewportWidth * 3) / window.innerWidth) : 0);
      const y = Math.max(state.canvasScale.y, Math.ceil((bottom + viewportHeight) / window.innerHeight), Math.ceil(2 / viewportZoom), window.scrollY / viewportZoom + viewportHeight * 1.5 > state.canvasScale.y * window.innerHeight ? Math.ceil((window.scrollY / viewportZoom + viewportHeight * 3) / window.innerHeight) : 0);
      if (x !== state.canvasScale.x || y !== state.canvasScale.y) useMyStore.setState({ canvasScale: { x, y } });
    };
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(expand); };
    expand();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => { cancelAnimationFrame(frame); window.removeEventListener('scroll', schedule); window.removeEventListener('resize', schedule); };
  }, [cardsData, brickSizes, viewportZoom]); // Layout growth never changes the viewport position.

  if (!isDemo && loading) return <div></div>;
  if (roleLoading || loadingProject) return <div className="pt-24 px-4" role="status">Loading project…</div>;
  if (roleError) return <div className="pt-24 px-4" role="alert">{roleError}</div>;
  if (loadError) return <div className="pt-24 px-4" role="alert">{loadError} <button onClick={() => openProject(projectId, isDemo)}>Retry</button></div>;

  return (
    <>
      <div onClick={() => { if (!isReviewer) setSelectedCardIds([]); }}
      id="canvas" onDragOver={onConnectorDragOver} onDrop={() => setConnectorDrag(null)} style={{ width: `${canvasScale.x * 100}vw`, height: `${canvasScale.y * 100}vh`, minWidth: (window.scrollX + window.innerWidth * 3) / viewportZoom, minHeight: Math.max(layoutBottom, (window.scrollY + window.innerHeight * 3) / viewportZoom), position: 'relative', zoom: viewportZoom }} className={`sketchbook-background ${panning ? "canvas-panning" : ""}`}>

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
            <Block
              zoom={viewportZoom}
              id={card.uid}
              displayPosition={layoutById.get(card.uid)?.position}
              layoutCards={layoutCards}
              onSize={onBrickSize}
              reviewMode={isReviewer}
              accountRole={role}
              key={card.uid}
              number={stage2number[card.stage]}
              stage={card.stage}
              comments={card.comments}
              handleDelete={handleDelete}
              text={card.description}
              changeSelectedCardIds={changeSelectedCardIds}
              selectedCardIds={selectedCardIds}
              onMove={onMoveBrick}
              onDockPreview={setDockPreview}
              onConnectorDragStart={onConnectorDragStart}
              onConnectorDragEnd={() => setConnectorDrag(null)}
              onClip={onClip}
              clipSourceId={clipSourceId}
            />
          )
        })}

        <BrickConnections cards={layoutCards.map(card => ({ ...card, position: dragPositions[card.uid] || card.position }))}
          preview={connectorDrag} links={links} readOnly={isReviewer} onRemove={link => useMyStore.getState().removeLink(link)} />
        <CanvasTrace cards={layoutCards} zoom={viewportZoom}/>
        {dockPreview && <div className="brick-dock-preview" aria-hidden="true" style={{ left: dockPreview.position.x, top: dockPreview.position.y + BOARD_TOP, height: dockPreview.height }}><span>Release to clip</span></div>}

      </div>
      <div className="project-name-row flex flex-row fixed top-20 left-4 z-10">
        <ProjectName key={isDemo ? "demo" : projectId} />
        {!isDemo && <button
          onClick={openModal}
          className="shrink-0 ml-1 bg-blue-500 hover:bg-blue-700 text-white py-2 px-3 rounded">
          Share
        </button>}
      </div>
      <div className="project-notes-placement"><ProjectNotes key={isDemo ? "demo" : projectId} /></div>

      {!isDemo && <CollaboratorModal isOpen={isModalOpen} onClose={closeModal} />}
      {saveError && <div role="alert" className="fixed top-32 left-4 z-20 bg-white p-2 text-sm text-red-600">{saveError} <button onClick={() => useMyStore.getState().retrySaves()}>Retry</button></div>}
      {saveStatus === "saving" && <span role="status" className="fixed top-32 left-4 z-20 text-sm bg-white p-1">Saving…</span>}

      {showEvaluation && <>
      {!isReviewer && <>
      <div aria-hidden="true" className={`canvas-toolbox evaluation-toolbox ${isReviewer ? "evaluation-toolbox-left" : ""}`} />
      <p className={`evaluation-toolbox-title ${isReviewer ? "evaluation-toolbox-title-left" : ""}`}>Evaluation:</p>
      </>}
      <StageEvaluation showLauncher={!isReviewer} draftPerStage={isReviewer} side={evaluationSide} key={`stage-${isDemo ? "demo" : projectId}`} isExpanded={isStageEvaluationExpanded} setIsExpanded={expanded => { setIsStageEvaluationExpanded(expanded); if (expanded) { setIsPersonaEvaluationExpanded(false); setSelectedCardIds(ids => ids.slice(-1)); } }} selectedCardIds={[...selectedCardIds]} number={evaluations.length} cardsData={cardsData} cardId2number={cardId2number} />
      <PersonaEvaluation role={role} showLauncher={!isReviewer} side={evaluationSide} isExpanded={isPersonaEvaluationExpanded} setIsExpanded={expanded => { setIsPersonaEvaluationExpanded(expanded); if (expanded) setIsStageEvaluationExpanded(false); }} number={evaluations.length} cardsData={cardsData} cardId2number={cardId2number} key={`persona-${isDemo ? "demo" : projectId}`} selectedPersona={personas.filter(item => item.isSelected === true)} />

      </>}

      <MiniMap zoom={viewportZoom} />
      {(clipSourceId || dockPreview) && <div className="brick-hint" role="status">{clipSourceId ? clipMessage : "Release to clip these bricks together"}</div>}

      {showEvaluation && (
      <div className={`fixed ${isReviewer ? "bottom-4" : "top-20"} ${isReviewer ? "left-4" : ((isProblemEvaluationExpanded || isStageEvaluationExpanded || isPersonaEvaluationExpanded) ? "right-[400px]" : "right-4")} mb-4 ml-4 z-10 canvas-toolbox persona-toolbox`}>
        <div className="persona-toolbox-header flex flex-row items-center gap-2">
          <p className="toolbox-title">Personas</p>
          <div className="flex flex-row relative">
            {
              !newPersona ? <button type="button" aria-label="Create persona" title="Create persona" onClick={() => { setNewPersona(true); if (isReviewer) { setIsStageEvaluationExpanded(false); setIsPersonaEvaluationExpanded(false); } }} className="persona-toolbox-create text-white bg-blue-700 hover:bg-blue-800 focus:outline-none">+</button> : null
            }
          </div>
        </div>
        <div className="persona-toolbox-list">
          {
            personas.map((persona, index) => (
              <PersonaIcon accountRole={role} openAbove={isReviewer} alignLeft={isReviewer} key={persona.uid} personaId={persona.uid} imgUrl={persona.imgUrl || personaImgUrls[index % personaImgUrls.length]} description={persona.description} isSelected={persona.isSelected} toggleFunction={togglePersonaSelection} idx={index} />
            ))
          }

        </div>
      </div>

      )}

      {showEvaluation && newPersona && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="persona-creation-dialog w-full max-w-4xl max-h-[85vh] overflow-y-auto rounded-xl bg-white p-6 shadow-lg">
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
            <label className="persona-structured-toggle"><input type="checkbox" disabled={apiPending} checked={personaModel === "gpt-6.1-sol"} onChange={e => setPersonaModel(e.target.checked ? "gpt-6.1-sol" : "gpt-4")}/><span>Use GPT-6.1 Sol</span></label>
            <label className="persona-structured-toggle"><input type="checkbox" disabled={apiPending} checked={personaMode === "workbench"} onChange={e => { setPersonaMode(e.target.checked ? "workbench" : "classic"); setCandidatePersonas([]); }}/><span>Structured profile</span></label>
            <p className="my-4 text-sm text-gray-700">
              {personaMode === "workbench" ? "Give this stakeholder a short label, then describe their situation and what matters to them." : "Describe a stakeholder who might potentially be negatively impacted by the AI product."}
            </p>
            {personaApiError && <p role="alert" className="mt-2 text-sm text-red-600">{personaApiError}</p>}
            {candidatePersonas.length !== 0 && (
              <div>
                {personaMode === "workbench" && <p className="workbench-hint">The first suggestion fills the form automatically. Select another suggestion to replace it, then review the profile before saving.</p>}
                {candidatePersonas.map(item => (
                  <button type="button"
                    key={typeof item === "string" ? item : item.description}
                    onClick={() => { setPersonaInputTextWrapper(typeof item === "string" ? item : item.description); setPersonaProfile(typeof item === "string" ? emptyProfile() : item.profile); }}
                    className="block w-full text-left rounded border border-gray-100 my-1 p-2 text-sm hover:bg-blue-100 cursor-pointer"
                  >
                    {typeof item === "string" ? item : item.description}
                  </button>
                ))}
              </div>
            )}
            {personaMode === "workbench" ? <>
              <label className="workbench-mode">Persona label
                <input ref={personaInputTextRef} className="persona-label-input" disabled={apiPending}
                  placeholder="e.g., Applicant returning after a career break"
                  value={personaInputText} onChange={e => setPersonaInputTextWrapper(e.target.value)}/>
              </label>
              <p className="workbench-hint">Shown on the canvas. Use the fields below for the full profile.</p>
              <div className="persona-creation-profile"><ProfileFields value={personaProfile} onChange={setPersonaProfile} disabled={apiPending}/></div>
            </> : <textarea
              ref={personaInputTextRef}
              aria-label="Persona summary"
              className="no-drag mt-4 w-full border border-gray-300 p-3 mb-3 text-sm"
              placeholder="Describe your persona..."
              value={personaInputText}
              onChange={(e) => setPersonaInputTextWrapper(e.target.value)}
            />}
                  {apiPending && (
                    <p className="mb-2 text-sm text-gray-500">
                      {personaMode === "workbench" ? "Generating profiles… the first suggestion will fill this form for review." : "Generating personas... you can keep editing while this runs."}
                    </p>
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
                disabled={!personaInputText.trim() || apiPending}
                onClick={async () => { if (await addPersona()) setNewPersona(false); }}
                type="button"
                className="ml-2 text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2.5 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {showLifecycle && (
      <div className="canvas-toolbox lifecycle-toolbox fixed z-10">
        <div className="flex flex-row">
          <div className="flex flex-col">
            <p className="toolbox-title">Lifecycle Blocks</p>
            {
              ["problem", "task", "data", "model", "train", "test", "deploy", "feedback"].map((stage, index) => (
                <div className="relative" key={stage}>
                  <button
                    type="button"
                    onMouseDown={event => event.preventDefault()}
                    onClick={() => {
                      const viewport = { left: window.scrollX, top: window.scrollY };
                      addCardData(stage);
                      requestAnimationFrame(() => window.scrollTo({ ...viewport, behavior: 'instant' }));
                    }}
                    onMouseEnter={() => setHovered(stage)}
                    onMouseLeave={() => setHovered("")}
                    className={`lifecycle-toolbox-action ${stage === 'problem' ? 'bg-problem' :
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
                    className={`absolute text-sm h-min ${index===7?"w-[500px]":"w-[300px]"} bg-black text-white text-left pl-2 left-full ml-3 transform -translate-y-[36px] z-[30] transition-opacity duration-300 whitespace-pre-wrap ${hovered === stage ? "visible opacity-100" : "invisible opacity-0"}`}>
                    {prompts[hovered]}
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      </div>
      )}

    </>

  );
};

export default Canvas;
