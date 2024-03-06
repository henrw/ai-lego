import React, { useRef, useState, useEffect } from "react";
import { ItemTypes } from "../Constants";
import Draggable from "react-draggable";
import Xarrow from "react-xarrows";
import useMyStore from "../../contexts/projectContext";
import { shallow } from "zustand/shallow";
import Popup from "reactjs-popup";
import { v4 as uuidv4 } from "uuid";
import { FaSave } from "react-icons/fa";
import { FaEdit } from "react-icons/fa";
import CommentComponent from "./Comment";
import MessageBox from "./Message";
import EvaluationBox from "./Evaluation";
import { useUserAuth } from "../../authentication/UserAuthContext";

const ConnectPointsWrapper = ({ cardId, handler, dragRef, cardRef }) => {
  const ref1 = useRef();

  const [position, setPosition] = useState({});
  const [beingDragged, setBeingDragged] = useState(false);

  return (
    <React.Fragment>
      <div
        className="connectPoint top-[calc(50%-7.5px)] right-1 absolute w-2 h-2 rounded-full bg-black"
        style={{
          ...position,
        }}
        draggable
        onMouseDown={(e) => e.stopPropagation()}
        onDragStart={(e) => {
          setBeingDragged(true);
          e.dataTransfer.setData("arrow", cardId);
        }}
        onDrag={(e) => {
          const { offsetTop, offsetLeft } = cardRef.current;
          const { x, y } = dragRef.current.state;
          setPosition({
            position: "fixed",
            left: e.clientX - x - offsetLeft,
            top: e.clientY - y - offsetTop,
            transform: "none",
            opacity: 0,
          });
        }}
        ref={ref1}
        onDragEnd={(e) => {
          setPosition({});
          setBeingDragged(false);
        }}
      />
      {beingDragged ? (
        <Xarrow
          path="straight"
          start={cardId}
          startAnchor={"right"}
          end={ref1}
          color="#9CAFB7"
        />
      ) : null}
    </React.Fragment>
  );
};
const colorClasses = {
  problem: "problem",
  task: "task",
  data: "data",
  model: "model",
  train: "train",
  test: "test",
  deploy: "deploy",
  design: "design",
  develop: "develop",
  modelEvaluation: "modelEva",
  modelDevelopment: "modelDev",
  MLOps: "MLOps",
  feedback: "feedback",
  problemDef: "problemDef",
  "➕": "➕",
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

export default function Card({ id, stage, handleDelete, text, comments, handler, cardId }) {
  const { user } = useUserAuth();
  const borderColorClass = getBorderColorClassFromId(id);
  const bgColorClass = getBgColorClassFromId(stage);
  const cardData = useMyStore(
    (store) => store.cards.filter((cardData) => cardData.uid === id)[0],
    shallow
  );
  const evaluationData = useMyStore(
    (store) => store.evaluations.filter(() => (true)), // TODO filter the card-matched evaluations only
    shallow
  );
  // Extract the stage description from cardData

  const prompt = cardData ? cardData.prompt : "No prompt available";
  const setCardPosition = useMyStore((store) => store.setCardPosition);
  const dragRef = useRef();
  const cardRef = useRef();

  const renderStageNameTrigger = () => (
    <div className={`${bgColorClass} p-1 py-0 rounded text-center`}>
      {stageName}
    </div>
  );
  const handleStop = (event, dragElement) => {
    setCardPosition(dragElement.node.id, {
      x: dragElement.x,
      y: dragElement.y,
    });
  };

  const addLink = useMyStore((store) => store.addLink);
  const addComment = useMyStore((store) => store.addComment);
  const stageName =
    stage.charAt(0).toUpperCase() + stage.slice(1);

  const refreshLinks = useMyStore((store) => store.refreshLinks); // Add this function inside the Card component before the return statement

  const handleTextChange = (newText, cardId) => {
    // Call a store action to update the text for this specific card
    useMyStore.getState().setCardDescription(cardId, newText);
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

  // // Function to update the text of a specific comment box
  // const updateCommentBoxText = (id, text) => {
  //   setCommentBoxes(
  //     commentBoxes.map((box) => (box.id === id ? { ...box, text } : box))
  //   );
  // };

  // Add a Tailwind CSS class for fixed width and flexible height
  const cardClass = "relative bg-gray-200 rounded shadow p-2 w-60";


  // // This function toggles edit mode for a comment box
  // const toggleEdit = (cardId, commentId = null) => {
  //   const boxIndex = commentBoxes.findIndex((box) => box.id === cardId);
  //   if (boxIndex === -1) return;

  //   const updatedBoxes = [...commentBoxes];
  //   const box = updatedBoxes[boxIndex];

  //   // Toggle the isEditing state and set commentId if provided
  //   updatedBoxes[boxIndex] = {
  //     ...box,
  //     isEditing: !box.isEditing,
  //     commentId: commentId ?? box.commentId, // Keep the same commentId if not provided
  //   };
  //   setCommentBoxes(updatedBoxes);
  // };

  return (
    <Draggable
      ref={dragRef}
      onStop={handleStop}
      position={cardData.position}
      onDrag={(e) => {
        refreshLinks();
      }}
    >
      <div
        className={`absolute bg-gray-200 rounded shadow p-2 ${showComments ? "" : "min-h-[100px]"
          } `} // w-96 for fixed width
        id={id}
        ref={cardRef}
        style={{ paddingBottom: "0" }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          if (e.dataTransfer.getData("arrow") != cardId) {
            const refs = { start: e.dataTransfer.getData("arrow"), end: id };
            addLink(refs);
          }
        }}
      >
        <button
          onClick={() => handleDelete(id, cardId)}
          className="absolute top-0 right-0 text p-1"
        >
          ❌
        </button>
        <div className={`absolute top-1 left-1 flex flex-row items-center`}>
          {renderStageNameTrigger()}
          {
            evaluationData.length !== 0 && (
              <button className="ml-1 bg-red-500 px-1.5 py-0 rounded text-white text-sm"
                onClick={() => { setShowComments(true); setTimeout(refreshLinks, 0); }}>
                {evaluationData.length}
              </button>
            )
          }
          {/* <Popup
            trigger={renderStageNameTrigger} // Set the trigger to the function that renders the stage name
            on="hover" // Set the Popup to trigger on hover
            position={["top center", "bottom right", "bottom left"]} // Adjust the position as needed
            closeOnDocumentClick
            keepTooltipInside={true}
            mouseLeaveDelay={300} // Delay in milliseconds before the Popup closes after mouse leaves
            mouseEnterDelay={0} // Delay in milliseconds before the Popup opens on mouse enter
            contentStyle={{
              padding: "10px",
              border: "none",
              maxWidth: "400px", // Set a maximum width for the popup content
              wordWrap: "break-word", // Ensures that text breaks to prevent overflow
              whiteSpace: "normal", // Allows text to wrap normally
              maxHeight: "150px", // Optional: Set a maximum height
              overflow: "auto", // Optional: Provide a scrollbar for overflow content
            }}
            arrow={false}
          >
            <div
              className="hover-box"
              style={{
                border: "1px solid #e2e8f0",
                padding: "10px",
                width: "auto",
                borderRadius: "5px",
                backgroundColor: "white",
                boxShadow: "0px 0px 10px rgba(0,0,0,0.1)",
              }}
            >
              <span>{prompt}</span>
            </div>
          </Popup> */}
        </div>

        <ConnectPointsWrapper cardId={id} {...{ handler, dragRef, cardRef }} />

        <div className="mt-4 flex flex-row">
          {/* <div> */}
          <div className={`pr-2 ${showComments && "vertical-line-container"}`}>
            {showPrompt && (
              <div className="flex flex-col w-60">
                <div className="p-3 bg-gray-100">
                  {prompt}
                </div>
              </div>
            )}
            <textarea
              className="p-3 mt-2 w-60"
              value={text}
              onChange={(e) => handleTextChange(e.target.value, id)}
              onClick={() => { setShowPrompt(!showPrompt); setTimeout(refreshLinks, 0); }}
              onDoubleClick={() => { }}
              placeholder="Describe this stage..."
            />

            <div className="text-lg mt-2 ">
              <button className="pr-1" onClick={() => { setShowComments(!showComments); setTimeout(refreshLinks, 0); }}>
                💬
              </button>

              {/* <button
                className="pr-1"
                onClick={() => {
                  console.log("Button clicked, current state:", open);
                  setOpen((o) => !o);
                }}
              >
                🔍
              </button> */}
            </div>

            {/* {hasComments && (
              <button onClick={toggleCommentsVisibility}>
                {showComments ? "⬆️" : "⬇️"}
              </button>
            )} */}
          </div>


          {showComments && (
            <div className="pl-2 w-48 text-sm">
              <div className="overflow-y-auto overflow-x-hidden max-h-80 h-100">
                {
                  comments.map((comment) => (
                    <MessageBox key={comment.uid} commentId={comment.uid} name={comment.by} time={typeof comment.lastUpdatedTime === 'string' ? comment.lastUpdatedTime : comment.lastUpdatedTime.toDate().toLocaleDateString('en-US') || "Now"} profileImg={"TODO"} message={comment.text} />
                    // <div key={box.id} className="flex items-center space-x-1">
                    //   <textarea
                    //     className="block p-1 w-full lg:w-5/6 border-gray-300 rounded mb-2"
                    //     placeholder="Add a comment..."
                    //     value={box.text}
                    //     onChange={(e) => updateCommentBoxText(box.id, e.target.value)}
                    //     disabled={!box.isEditing}
                    //   />
                    //   {box.isEditing ? (
                    //     <button
                    //       className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-1 rounded text-sm "
                    //       onClick={() => handleSaveComment(box.id)}
                    //     >
                    //       <FaSave />
                    //     </button>
                    //   ) : (
                    //     <button
                    //       className="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-1 rounded text-sm  "
                    //       onClick={() => toggleEdit(box.id, box.commentId)}
                    //     >
                    //       <FaEdit />
                    //     </button>
                    //   )}
                    // </div>
                  ))
                }
                {
                  evaluationData.map((evaluation) => (
                    <EvaluationBox evaluationData={evaluation} />
                  ))
                }
                <br />
                <br />
              </div>

              <div className="absolute bottom-2 h-max flex flex-row items-center rounded-3">
                <input
                  type="text"
                  className="w-full rounded-3 p-1"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Enter Comment"
                />
                <button
                  onClick={() => {
                    addComment(user.displayName, id, commentText);
                    setCommentText(""); // Clear the input after saving the comment
                  }}
                  type="button" className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm p-2 text-center inline-flex items-center me-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
                  <svg className="w-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 10">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 5h12m0 0L9 1m4 4L9 9" />
                  </svg>
                  <span className="sr-only">Icon description</span>
                </button>
              </div>

            </div>
          )
          }
        </div>
        {/* <Popup open={open} closeOnDocumentClick onClose={closeModal}>
          {(close) => (
            <div className=" w-[500px] p-3 bg-white rounded shadow-lg border-8 border-gray-200 text-gray-700 ">
              <button
                className="text-black absolute top-0 right-0 mt-4 mr-4"
                onClick={close}
              >
                &times;
              </button>
              <div
                className={`text-lg font-bold border-b  p-1 py-0 mb-2  ${bgColorClass} rounded-lg`}
              >
                {stageName}
              </div>

              <div className="mb-4 text-sm overflow-auto">{text}</div>

              {showSmallCommentBox && (
                <div>
                  <textarea
                    className="comment-box w-full border border-gray-300 p-2 mb-2 rounded" // Set the width to full
                    placeholder="Type your comment here..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                  ></textarea>
                  <button
                    className="text-white font-bold py-1 px-2 rounded text-sm"
                    style={{ backgroundColor: "cornflowerblue" }} // Inline style to set the button color
                    onClick={() => {
                      handleSaveComment(commentText);
                      setCommentText(""); // Clear the input after saving the comment
                    }}
                  >
                    Save
                  </button>
                </div>
              )}
              <div className={`comments-section ${borderColorClass}`}>
                {comments
                  .filter((comment) => !comment.parentId)
                  .map((comment) => (
                    <CommentComponent
                      key={comment.id}
                      comment={comment}
                      handleReplyToComment={handleReplyToComment}
                      level={0}
                      allComments={comments}
                    />
                  ))}
              </div>
            </div>
          )}
        </Popup> */}
      </div>
    </Draggable>
  );
}
