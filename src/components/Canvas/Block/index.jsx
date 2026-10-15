import React, { useRef, useState, useEffect } from "react";
import Draggable from "react-draggable";
import useMyStore, { colorClasses, prompts } from "../../../contexts/projectContext";
import { shallow } from "zustand/shallow";
import MessageBox from "./Message";
import EvaluationBox from "./Evaluation";
import { ReviewHistory } from "./IssueResolution";
import { completedReviews } from "../../../utils/issueResolution";
import { STUD, BOARD_TOP, snapPosition, findDock } from "../brickGeometry";

const getBgColorClassFromId = (stage) => colorClasses[stage] ? `bg-${colorClasses[stage]}` : "bg-white";

export default function Card({ zoom = 1, displayPosition, layoutCards, onSize, id, stage, number, handleDelete, text, comments = [], changeSelectedCardIds, selectedCardIds, onMove, onDockPreview, onClip, onConnectorDragStart, onConnectorDragEnd, clipSourceId, reviewMode = false, accountRole = "admin" }) {

  const traceEntry = useMyStore(store => store.scenarioPlayback?.entries.slice(0, store.scenarioPlayback.index + 1).find(entry => entry.cardId === id && (entry.stakeholderExperience || entry.comment)));
  const textAreaRef = useRef(null);
  const projectId = useMyStore(store => store.projectId);
  const isDemo = useMyStore(store => store.isDemo);
  const draftKey = `card-draft-${projectId}-${id}`;
  const draftRef = useRef(null);
  const dirtyRef = useRef(false);
  const saveTimerRef = useRef(null);
  const saveDraft = async value => {
    const ok = await useMyStore.getState().setCardDescription(id, value);
    if (ok && draftRef.current === value) { dirtyRef.current = false; try { sessionStorage.removeItem(draftKey); } catch {} }
  };
  useEffect(() => {
    try {
      const recovered = sessionStorage.getItem(draftKey);
      if (recovered !== null) { draftRef.current = recovered; dirtyRef.current = true; if (textAreaRef.current) textAreaRef.current.value = recovered; saveDraft(recovered); }
    } catch {}
    // Read the latest timer handle at cleanup, rather than the initial handle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return () => clearTimeout(saveTimerRef.current);
  }, [draftKey]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!textAreaRef.current) {
      return;
    }
    if (!dirtyRef.current) textAreaRef.current.value = text;
    textAreaRef.current.style.height = "auto";
    textAreaRef.current.style.height = textAreaRef.current.scrollHeight + "px";
    useMyStore.getState().refreshLinks();
  }, [id, text]);

  const bgColorClass = getBgColorClassFromId(stage);
  const cardData = useMyStore(
    (store) => store.cards.filter((cardData) => cardData.uid === id)[0],
    shallow
  );
  const evaluationData = useMyStore(
    (store) => store.evaluations.filter((evaluation) => evaluation.stageTrace?.entry?.cardId ? evaluation.stageTrace.entry.cardId === id : (evaluation.cardIds || []).includes(id) || evaluation.resolution?.changes?.some(change => change.cardId === id)),
    shallow
  );
  // Extract the stage description from cardData

  const prompt = cardData?.prompt || prompts[stage] || "No prompt available";
  const setCardPosition = useMyStore((store) => store.setCardPosition);
  const cardRef = useRef();

  useEffect(() => {
    const element = cardRef.current;
    if (!element || !onSize) return;
    const measure = () => onSize(id, { width: element.offsetWidth, height: element.offsetHeight });
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [id, onSize]);

  const [isDragging, setIsDragging] = useState(false);
  const measureCards = () => (layoutCards || useMyStore.getState().cards).map(card => ({ ...card, height: document.getElementById(card.uid)?.offsetHeight || 110 }));
  const handleStop = (event, dragElement) => {
    const dock = findDock(id, { x: dragElement.x, y: dragElement.y }, measureCards());
    const position = dock?.position || snapPosition({ x: dragElement.x, y: dragElement.y });
    setCardPosition(id, position);
    if (dock) addLink(dock.link);
    setIsDragging(false); onMove(id, null); onDockPreview(null);
  };

  const addLink = useMyStore((store) => store.addLink);
  const extendCanvasRight = useMyStore((store) => store.extendCanvasRight);
  const extendCanvasBottom = useMyStore((store) => store.extendCanvasBottom);
  const stageName =
    stage.charAt(0).toUpperCase() + stage.slice(1);

  const refreshLinks = useMyStore((store) => store.refreshLinks); // Add this function inside the Card component before the return statement

  const handleTextChange = (textArea, cardId) => {
    clearTimeout(saveTimerRef.current);
    if (dirtyRef.current) saveDraft(textArea.value);
    textArea.style.height = textArea.scrollHeight + 'px';
  };

  const setTextWrapper = (text) => {
    if (!textAreaRef.current) return;
    textAreaRef.current.value = text;
    draftRef.current = text; dirtyRef.current = true;
    useMyStore.getState().setCardDraft(id, text);
    try { sessionStorage.setItem(draftKey, text); } catch {}
    clearTimeout(saveTimerRef.current);
    if (isDemo) saveDraft(text); else saveTimerRef.current = setTimeout(() => saveDraft(text), 400);
    textAreaRef.current.style.height = "auto";
    textAreaRef.current.style.height = textAreaRef.current.scrollHeight + "px";
  };

  const [showComments, setShowComments] = useState(true);
  const feedbackTotal = comments.length + evaluationData.length;
  const reviewedIssues = [...comments, ...evaluationData].filter(issue => completedReviews(issue).length || issue.resolutionStatus === 'resolved');
  const reviewCount = reviewedIssues.reduce((count, issue) => count + (completedReviews(issue).length || 1), 0);
  const activeIssueCount = [...comments, ...evaluationData].filter(issue => issue.resolutionStatus !== 'resolved').length;
  useEffect(() => { refreshLinks(); }, [showComments, feedbackTotal, activeIssueCount, refreshLinks]);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isTextFocused, setIsTextFocused] = useState(false);
  const promptVisible = showPrompt || isTextFocused;
  const [selected, setSelected] = useState(false);

  if (!cardData) return null;
  return (
    <Draggable
      scale={zoom}
      disabled={reviewMode}
      nodeRef={cardRef}
      onStop={handleStop}
      position={displayPosition || snapPosition(cardData.position)}
      grid={[STUD, STUD]}
      bounds={{ left: 0, top: 0 }}
      onStart={() => setIsDragging(true)}
      onDrag={(e, data) => {
        const position = snapPosition({ x: data.x, y: data.y });
        onMove(id, position);
        onDockPreview(findDock(id, position, measureCards()));
        // if (window.scrollX + e.clientX >= document.documentElement.scrollWidth - 50) {
        extendCanvasRight();
        // }
        // if (window.scrollY + e.clientY >= document.documentElement.scrollHeight - 50) {
        extendCanvasBottom();
        // }
      }}
      cancel=".no-drag"
    >
      <div
        className={`lego-brick ${reviewMode ? "brick-reviewable" : ""} absolute text-sm flex flex-col justify-center bg-white shadow ${stageName!=="Note"? "w-60" : "w-[700px]"} ${isDragging ? "brick-lifted" : ""} ${promptVisible || (showComments && feedbackTotal > 0) ? "brick-overlay-active" : ""} ${clipSourceId === id ? "brick-connecting" : ""} ${selectedCardIds.includes(id) ? "brick-selected" : ""}`} // w-96 for fixed width
        id={id}
        ref={cardRef}
        style={{ top: BOARD_TOP }}
        title={reviewMode ? `Click to evaluate the ${stageName} stage` : undefined}
        onClick={(e) => { if (clipSourceId && clipSourceId !== id) onClip(id); else { changeSelectedCardIds(id); setSelected(!selected); } e.stopPropagation();}}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault(); e.stopPropagation();
          onConnectorDragEnd?.();
          if (!reviewMode && stage !== "note" && e.dataTransfer.getData("arrow") && e.dataTransfer.getData("arrow") !== id) {
            const refs = { start: e.dataTransfer.getData("arrow"), end: id };
            addLink(refs);
          }
        }}
      >
        <div className="grow-1">
          <div className={`brick-header flex flex-row justify-between items-center ${bgColorClass} px-2 py-2 text-lg font-mono font-bold`}
            tabIndex={0} aria-label={reviewMode ? `Evaluate ${stageName} stage` : `Move ${stageName} brick. Use arrow keys to move by one stud.`}
            onKeyDown={event => {
              if (event.target !== event.currentTarget) return;
              if (reviewMode) {
                if (event.key === "Enter" || event.key === " ") { event.preventDefault(); changeSelectedCardIds(id); }
                return;
              }
              const steps = { ArrowLeft: [-STUD, 0], ArrowRight: [STUD, 0], ArrowUp: [0, -STUD], ArrowDown: [0, STUD] };
              if (!steps[event.key]) return;
              event.preventDefault();
              const [dx, dy] = steps[event.key];
              setCardPosition(id, snapPosition({ x: (displayPosition || cardData.position).x + dx, y: (displayPosition || cardData.position).y + dy }));
            }}>
            <div className="flex flex-row">
              <div onMouseOver={() => setShowPrompt(true)} onMouseOut={() => setShowPrompt(false)}>{stageName}</div>
              {activeIssueCount > 0 && (
                <button className="no-drag ml-1 w-7 h-7 flex items-center justify-center hover:scale-105 transition-transform duration-150"
                  aria-label={showComments ? `Collapse ${stageName} comments` : `Expand ${stageName} comments`}
                  title={`${activeIssueCount} active issues${feedbackTotal > activeIssueCount ? "; review history available" : ""}`}
                  aria-expanded={showComments}
                  onClick={event => { event.stopPropagation(); setShowComments(!showComments); }}>
                  <svg className={`w-7 h-7 drop-shadow-sm ${activeIssueCount ? "animate-pulse" : ""}`} viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg">
                    <path d="M27 0H3C1.35 0 0 1.35 0 3V30L6 24H27C28.65 24 30 22.65 30 21V3C30 1.35 28.65 0 27 0Z" fill={activeIssueCount ? "#fca5a5" : "#cbd5e1"} />
                    <text x="50%" y="48%" className="text-sm" textAnchor="middle" fill="#111827" dominantBaseline="central">{activeIssueCount}</text>
                  </svg>
                </button>
              )}
            </div>
            {traceEntry && <span title={traceEntry.stakeholderExperience || traceEntry.comment} className={`trace-header-tag trace-marker-${traceEntry.status}`}>{traceEntry.status === 'concern' ? 'Draft concern' : traceEntry.status === 'insufficient_information' ? 'Draft question' : traceEntry.pending ? 'Streaming' : 'Examined'}</span>}
            {reviewMode && <span className="brick-evaluate-cue" aria-hidden="true">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L9 17l-4 1 1-4Z" /></svg>
              Evaluate
            </span>}
            {!reviewMode && <button
              onClick={event => { event.stopPropagation(); handleDelete(id); }}
              aria-label={`Delete ${stageName} brick`}
              className="no-drag text-gray-400 hover:text-red-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>}
          </div>
          <div
            className={`absolute bottom-[100%] left-0 h-min w-60 bg-black text-white text-left p-2 z-10 whitespace-pre-wrap transition-opacity duration-300 ${promptVisible ? "visible opacity-100" : "invisible opacity-0"}`}>
            {prompt}
          </div>
        </div>

        {stageName !== "Note" && <>
          <button type="button" id={id + "-right"} className="brick-clip no-drag" disabled={reviewMode} draggable={!reviewMode}
            aria-label={`Connect from ${stageName}`} title="Click this clip, then another brick. Or drag the clip onto a brick."
            onMouseDown={event => event.stopPropagation()}
            onClick={event => { event.stopPropagation(); onClip(id); }}
            onDragStart={event => { event.stopPropagation(); event.dataTransfer.setData("arrow", id); event.dataTransfer.effectAllowed = "link"; onConnectorDragStart?.(id, event); }}
            onDragEnd={() => onConnectorDragEnd?.()}><span aria-hidden="true" /></button>
          <button type="button" id={id + "-left"} className="brick-socket no-drag" disabled={reviewMode}
            aria-label={`Connect to ${stageName}`} title="Attach a connector here"
            onClick={event => { event.stopPropagation(); onClip(id); }} />
        </>}
        <div className="brick-well relative">
          <textarea
            id={id + "-textarea"}
            ref={textAreaRef}
            readOnly={reviewMode}
            aria-label={`${stageName} stage description`}
            className="no-drag w-full p-2 outline-none text-md"
            style={{ resize: "none", minHeight: '40px', height: 'auto', draggable: 'false' }}
            onClick={(event) => { if (reviewMode) changeSelectedCardIds(id); event.stopPropagation(); }}
            onChange={(e) => setTextWrapper(e.target.value)}
            onBlur={(e) => { setIsTextFocused(false); setShowPrompt(false); if (!reviewMode) handleTextChange(e.target, id);}}
            onFocus={() => { if (!reviewMode) setIsTextFocused(true); }}
            onDoubleClick={() => { }}
            placeholder="Describe this stage..."
          />
        </div>
        <div className={`flex flex-col grow-1`}>
          {showComments && activeIssueCount > 0 && (
            <div className={`${bgColorClass} space-y-2 p-2`}>
              <div className="font-mono font-bold">Evaluation</div>
              <div className="overflow-y-auto overflow-x-hidden max-h-80 h-100">
                {
                  comments.filter(comment => comment.resolutionStatus !== 'resolved').map((comment) => (
                    <MessageBox showHistory={false} issue={comment} role={accountRole} key={comment.uid} commentId={comment.uid} author={comment.author} by={comment.by} time={typeof comment.lastUpdatedTime === 'string' ? comment.lastUpdatedTime : comment.lastUpdatedTime?.toDate?.().toLocaleDateString('en-US') || "Now"} message={comment.text} />
                  ))
                }
                {
                  evaluationData.filter(evaluation => evaluation.resolutionStatus !== 'resolved').map((evaluation) => (
                    <EvaluationBox showHistory={false} role={accountRole} key={evaluation.uid} evaluationData={evaluation} />
                  ))
                }
              </div>

            </div>
          )
          }

          {reviewCount > 0 && <div className="bg-white px-2 pb-2 no-drag">
            <details className="resolution-history block-review-history" onClick={event => event.stopPropagation()} onMouseDown={event => event.stopPropagation()}>
              <summary>Review history ({reviewCount})</summary>
              {reviewedIssues.map(issue => <ReviewHistory key={issue.uid} issue={issue} embedded/>)}
            </details>
          </div>}

        </div>
      </div>
    </Draggable>
  );
}
