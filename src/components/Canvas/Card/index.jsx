import React, { useRef, useState, useEffect } from "react";
import Draggable from "react-draggable";
import Xarrow from "react-xarrows";
import useMyStore, { colorClasses } from "../../../contexts/projectContext";
import { shallow } from "zustand/shallow";
import Popup from "reactjs-popup";
import { v4 as uuidv4 } from "uuid";
import { FaSave } from "react-icons/fa";
import { FaEdit } from "react-icons/fa";
import CommentComponent from "./Comment";
import MessageBox from "./Message";
import EvaluationBox from "./Evaluation";
import { useUserAuth } from "../../../authentication/UserAuthContext";

const ConnectPointsWrapper = ({ id, dragRef, cardRef }) => {
  const ref1 = useRef();

  const [position, setPosition] = useState({
    position: "absolute",
    top: "20px",
    right: "0%",
    zIndex: 1
  });
  const [beingDragged, setBeingDragged] = useState(false);

  return (
    <React.Fragment>
      <div
        className="connectPoint right-0 top-[20px] absolute w-6 h-6 rounded-full transform translate-x-[50%] z-1001"
        style={{
          ...position,
        }}
        draggable
        onMouseDown={(e) => e.stopPropagation()}
        onDragStart={(e) => {
          setBeingDragged(true);
          e.dataTransfer.setData("arrow", id);
        }}
        onDrag={(e) => {
          const { offsetTop, offsetLeft } = cardRef.current;
          const { x, y } = dragRef.current.state;
          setPosition({
            position: "fixed",
            left: e.clientX + window.scrollX - x - offsetLeft,
            top: e.clientY + window.scrollY - y - offsetTop,
            transform: "none",
            opacity: 0,
          });
        }}
        ref={ref1}
        onDragEnd={(e) => {
          setPosition({
            position: "absolute",
            top: "20px",
            right: "0%",
            zIndex: 1
          });
          setBeingDragged(false);
        }}
      />
      {beingDragged ? (
        <Xarrow
          path="straight"
          headSize={4}
          start={id + "-right"}
          startAnchor={"right"}
          endAnchor={"left"}
          end={ref1}
          color="#9CAFB7"
          zIndex={0}
        />
      ) : null}
    </React.Fragment>
  );
};

const getBorderColorClassFromId = (stage) => {
  return `border-${colorClasses[stage]}`; // This will return something like "border-red-500"
};

// const getBgColorClassFromId = (id) => {
//   const stageName = id.split("-")[0];
//   return `bg-${colorClasses[stageName]}`;
// };
const getBgColorClassFromId = (stage) => {
  const bgColorClass = `bg-${colorClasses[stage]}`;
  return bgColorClass;
};

export default function Card({ id, stage, number, handleDelete, text, comments, changeSelectedCardIds, selectedCardIds }) {

  useEffect(() => {
    const textArea = document.getElementById(id + "-textarea");
    textArea.style.height = textArea.scrollHeight + 'px';
  })

  const { user } = useUserAuth();
  const borderColorClass = getBorderColorClassFromId(id);
  const bgColorClass = getBgColorClassFromId(stage);
  const cardData = useMyStore(
    (store) => store.cards.filter((cardData) => cardData.uid === id)[0],
    shallow
  );
  const evaluationData = useMyStore(
    (store) => store.evaluations.filter((evaluation) => (evaluation.cardIds.includes(id))), // TODO filter the card-matched evaluations only
    shallow
  );
  // Extract the stage description from cardData

  const prompt = cardData ? cardData.prompt : "No prompt available";
  const setCardPosition = useMyStore((store) => store.setCardPosition);
  const dragRef = useRef();
  const cardRef = useRef();

  const handleStop = (event, dragElement) => {
    setCardPosition(dragElement.node.id, {
      x: dragElement.x,
      y: dragElement.y,
    });
  };

  const addLink = useMyStore((store) => store.addLink);
  const addComment = useMyStore((store) => store.addComment);
  const extendCanvasRight = useMyStore((store) => store.extendCanvasRight);
  const extendCanvasBottom = useMyStore((store) => store.extendCanvasBottom);
  const stageName =
    stage.charAt(0).toUpperCase() + stage.slice(1);

  const refreshLinks = useMyStore((store) => store.refreshLinks); // Add this function inside the Card component before the return statement

  const handleTextChange = (textArea, cardId) => {
    useMyStore.getState().setCardDescription(cardId, textArea.value);
    textArea.style.height = textArea.scrollHeight + 'px';
  };

  // const handleReplyToComment = (parentId, replyText) => {
  //   if (!replyText) return; // Don't add empty replies

  //   const newReply = {
  //     id: uuidv4(),
  //     text: replyText,
  //     parentId,
  //     childComments: [],
  //   };

  //   /// Add newReply to comments state
  //   setComments((currentComments) => {
  //     const updatedComments = [...currentComments, newReply];
  //     return updatedComments;
  //   });
  // };

  // Add state to control the visibility of the popup
  const [showSmallCommentBox] = useState(true); // New state for small comment box

  // State to keep track of comment boxes
  const [hasComments, setHasComments] = useState(false);
  const [open, setOpen] = useState(false);
  const closeModal = () => setOpen(false);
  const [commentText, setCommentText] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  // Add a Tailwind CSS class for fixed width and flexible height
  const cardClass = "relative bg-gray-200 rounded shadow p-2 w-60";

  const [selected, setSelected] = useState(false);

  return (
    <Draggable
      ref={dragRef}
      onStop={handleStop}
      position={cardData.position}
      onDrag={(e) => {
        refreshLinks();

        // if (window.scrollX + e.clientX >= document.documentElement.scrollWidth - 50) {
        extendCanvasRight();
        // }
        // if (window.scrollY + e.clientY >= document.documentElement.scrollHeight - 50) {
        extendCanvasBottom();
        // }
      }}
    >
      <div
        className={`absolute z-1 text-sm flex flex-col justify-center w-60 bg-white rounded shadow ${selectedCardIds.includes(id) ? "outline outline-4 outline-blue-400" : ""}`} // w-96 for fixed width
        id={id}
        ref={cardRef}
        style={{ paddingBottom: "0" }}
        onClick={() => { changeSelectedCardIds(id); setSelected(!selected) }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          if (e.dataTransfer.getData("arrow") != id) {
            const refs = { start: e.dataTransfer.getData("arrow"), end: id };
            addLink(refs);
          }
        }}
      >
        <div className="grow-1">
          <div className={`flex flex-row justify-between items-center ${bgColorClass} rounded-t px-2 py-2 text-lg font-mono font-bold`}>
            <div className="flex flex-row">
              <div onMouseOver={() => setShowPrompt(true)} onMouseOut={() => setShowPrompt(false)}>{stageName}#{number}</div>
              {
                (comments.length) !== 0 && (
                  <button className="ml-1 text-white"
                    onClick={() => { setShowComments(!showComments); setTimeout(refreshLinks, 0); }}>
                    <svg className="w-7 h-7" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="5%" y="5%" width="26" height="21" fill="#fcba03"></rect>
                      <path d="M27 0H3C1.35 0 0 1.35 0 3V30L6 24H27C28.65 24 30 22.65 30 21V3C30 1.35 28.65 0 27 0ZM27 21H4.8L3 22.8V3H27V21Z" fill="#fcba03" stroke="" strokeWidth="1" />
                      <text x="50%" y="48%" className="text-sm" textAnchor="middle" fill="black" dominantBaseline="central">{comments.length}</text>
                    </svg>
                  </button>
                )
              }
              {
                (evaluationData.length) !== 0 && (
                  <button className="ml-1 text-white"
                    onClick={() => { setShowComments(!showComments); setTimeout(refreshLinks, 0); }}>
                    <svg className="w-7 h-7" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg">
                      <polygon points="15,0 28,24 2,24" fill="white" stroke="#ef4444" strokeWidth="3" />
                      <text x="50%" y="50%" className="text-sm" textAnchor="middle" fill="black" dominantBaseline="central">{evaluationData.length}</text>
                    </svg>
                  </button>
                )
              }


            </div>
            <button
              onClick={() => handleDelete(id)}
              className="text-gray-400 hover:text-red-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {/* {showPrompt && (
            <div className="p-2 font-mono ">
              {prompt}
            </div>
          )} */}
          <div
            className={`absolute bottom-[100%] left-0 h-min w-60 rounded bg-black text-white text-center fixed z-10 transition-opacity duration-300 ${showPrompt ? "visible opacity-100" : "invisible opacity-0"}`}>
            {prompt}
          </div>
        </div>

        <div className="relative">
          <ConnectPointsWrapper {...{ id, dragRef, cardRef }} />
          <div id={id + "-right"} className="absolute right-0 top-[20px] transform translate-x-[50%] z-0">
            <svg className="w-5 h-5" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="20" cy="20" r="20" fill="white" />
              <circle cx="20" cy="20" r="10" fill="black" />
            </svg>
          </div>
          <div id={id + "-left"} className="absolute left-0 h-6 top-[20px] transform z-0">
          </div>
          <textarea
            id={id + "-textarea"}
            className="p-2 w-60 outline-none text-md"
            value={text}
            style={{ resize: "none", minHeight: '40px', height: 'auto' }}
            onClick={(event) => { event.stopPropagation(); }}
            onChange={(e) => handleTextChange(e.target, id)}
            onBlur={() => { setShowPrompt(false); }}
            onFocus={() => { setShowPrompt(true); }}
            onDoubleClick={() => { }}
            placeholder="Describe this stage..."
          />
        </div>
        <div className={`flex flex-col grow-1`}>
          {showComments && (
            <div className={`${bgColorClass} space-y-2 p-2`}>
              <div className="font-mono font-bold">Discussions</div>
              <div className="overflow-y-auto overflow-x-hidden max-h-80 h-100">
                {
                  comments.map((comment) => (
                    <MessageBox key={comment.uid} commentId={comment.uid} name={comment.by} time={typeof comment.lastUpdatedTime === 'string' ? comment.lastUpdatedTime : comment.lastUpdatedTime.toDate().toLocaleDateString('en-US') || "Now"} profileImg={"TODO"} message={comment.text} />
                  ))
                }
                {
                  evaluationData.map((evaluation) => (
                    <EvaluationBox evaluationData={evaluation} />
                  ))
                }
              </div>

              <div className="relative bottom-0 h-max flex space-x-1 flex-row items-center rounded-3">
                <input
                  type="text"
                  className="w-full rounded-3 p-1 outline-none"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Enter Comment"
                />
                <button
                  onClick={() => {
                    addComment(user.displayName, id, commentText);
                    setCommentText(""); // Clear the input after saving the comment
                  }}
                  type="button" className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg  p-2 text-center inline-flex items-center me-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
                  <svg className="w-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 10">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 5h12m0 0L9 1m4 4L9 9" />
                  </svg>
                  <span className="sr-only">Icon description</span>
                </button>
              </div>

            </div>
          )
          }
          <button className={`flex justify-center rounded-b bg-gray-100 h-5`}
            onClick={(e) => { e.stopPropagation(); setShowComments(!showComments); setTimeout(refreshLinks, 0); }}>
            <svg width="40" height="20" viewBox="0 0 134 39" fill="none" xmlns="http://www.w3.org/2000/svg">
              {showComments && <path d="M133.5 19.5L67 0.5L0.5 19.5V38.5L67 19.5L133.5 38.5V19.5Z" fill="#D2D2D2" />}
              {!showComments && <path d="M0.5 19.5L67 38.5L133.5 19.5V0.5L67 19.5L0.5 0.5L0.5 19.5Z" fill="#D2D2D2" />}
            </svg>
          </button>
        </div>
      </div>
    </Draggable>
  );
}
