// Card.jsx
import React, { useRef, useState } from "react";
// import { ItemTypes } from "../Constants";
import Draggable from "react-draggable";
import Xarrow from "react-xarrows";
import useMyStore from "../../context";
import { shallow } from "zustand/shallow";
import Popup from "reactjs-popup";
import { v4 as uuidv4 } from "uuid";

const getStageColor = (id) => {
  const stage = id.split("_")[0];
  console.log(stage);
};

const ConnectPointsWrapper = ({ boxId, handler, dragRef, boxRef }) => {
  const ref1 = useRef();

  const [hovered, setHovered] = useState(false);
  const [position, setPosition] = useState({});
  const [beingDragged, setBeingDragged] = useState(false);

  return (
    <React.Fragment>
      <div
        className={`connectPoint ${
          hovered
            ? "top-[calc(50%-9.5px)] right-[-22px]"
            : "top-[calc(50%-7.5px)] right-[-20px]"
        } absolute ${hovered ? "w-4 h-4" : "w-3 h-3"} rounded-full bg-sky-500`}
        style={{
          ...position,
        }}
        onMouseEnter={() => {
          setHovered(true);
        }}
        onMouseLeave={() => {
          setHovered(false);
        }}
        draggable
        onMouseDown={(e) => e.stopPropagation()}
        onDragStart={(e) => {
          setBeingDragged(true);
          e.dataTransfer.setData("arrow", boxId);
        }}
        onDrag={(e) => {
          const { offsetTop, offsetLeft } = boxRef.current;
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
          start={boxId}
          startAnchor={"right"}
          end={ref1}
        />
      ) : null}
    </React.Fragment>
  );
};

export default function Card({ id, handleDelete, text, handler, boxId }) {
  // const [text, setText] = useState("");
  const isSelected = useCanvasStore(
    (store) => store.selectedCardId === id,
    shallow
  );
  const canvasActions = useCanvasStore((store) => store.actions);

  const cardData = useMyStore(
    (store) => store.cardsData.filter((cardData) => cardData.id === id)[0],
    shallow
  );

  const setCardPosition = useMyStore((store) => store.setCardPosition);
  const dragRef = useRef();
  const boxRef = useRef();

  const handleStop = (event, dragElement) => {
    setCardPosition(dragElement.node.id, {
      x: dragElement.x,
      y: dragElement.y,
    });
  };

  const addArrow = useMyStore((store) => store.addArrow);
  const stageName =
    id.split("-")[0].charAt(0).toUpperCase() + id.split("-")[0].slice(1);

  const refreshArrows = useMyStore((store) => store.refreshArrows); // Add this function inside the Card component before the return statement

  const handleTextChange = (newText, cardId) => {
    // Call a store action to update the text for this specific card
    useMyStore.getState().updateCardText(cardId, newText);
  };

  // Add state to control the visibility of the popup
  const [open, setOpen] = useState(false);
  const closeModal = () => setOpen(false);
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");

  // const handleSaveComment = (text, parentId = null) => {
  //   const newComment = {
  //     id: uuidv4(), // you can use a package like uuid to generate unique ids
  //     text,
  //     parentId,
  //     childComments: [],
  //   };
  //   // Add logic to handle nested comments if parentId is not null
  //   setComments((currentComments) => [...currentComments, newComment]);
  // };
  const handleSaveComment = (text, parentId = null) => {
    if (!text) return; // Don't save empty comments
    const newComment = {
      id: uuidv4(),
      text: text, // Use the text passed as an argument
      parentId: parentId,
      childComments: [],
    };
    setComments((currentComments) => [...currentComments, newComment]);
  };

  const CommentComponent = ({ comment }) => (
    <div className="comment">
      <p>{comment.text}</p>
      {/* Button to reply to a comment */}
      <button onClick={() => handleReplyToComment(comment.id)}>Reply</button>
      {/* Render nested comments */}
      {comment.childComments.map((childId) => {
        const childComment = comments.find((c) => c.id === childId);
        return <CommentComponent key={childId} comment={childComment} />;
      })}
    </div>
  );
  const handleReplyToComment = (parentId, replyText) => {
    // First, create the new comment object with a reference to its parent
    const replyComment = {
      id: uuidv4(),
      text: replyText,
      parentId: parentId,
      childComments: [],
    };

    // Then, add the new comment to the main comments array
    setComments((currentComments) => [...currentComments, replyComment]);

    // Lastly, find the parent comment and update its childComments array
    setComments((currentComments) =>
      currentComments.map((comment) =>
        comment.id === parentId
          ? {
              ...comment,
              childComments: [...comment.childComments, replyComment.id],
            }
          : comment
      )
    );
  };

  const handleClick = (e) => {
    switch (e.detail) {
      case 1:
        isSelected
          ? canvasActions.unselectCard()
          : canvasActions.selectCardId(id);
        break;
      case 2:
        isSelected
          ? canvasActions.unselectCard()
          : canvasActions.selectCardId(id);
        break;
    }
  };

  return (
    <Draggable
      ref={dragRef}
      onStop={handleStop}
      position={cardData.position}
      onDrag={(e) => {
        refreshArrows();
      }}
    >
      <div
        className={`rounded-lg flex flex-col bg-white w-40 h-28 ${
          isSelected ? "outline outline-offset-1 outline-1 outline-sky-500" : ""
        } z-10`}
        id={boxId}
        ref={boxRef}
        onDragOver={(e) => e.preventDefault()}
        onKeyDown={(e) => {
          console.log(e.key);
        }}
        onClick={handleClick}
        onDrop={(e) => {
          console.log(e.dataTransfer.getData("arrow"));
          if (e.dataTransfer.getData("arrow") != boxId) {
            const refs = { start: e.dataTransfer.getData("arrow"), end: boxId };
            addArrow(refs);
          }
        }}
      >
        <div
          className={`text-lg flex flex-row font-bold bg-${
            id.split("-")[0]
          } p-2 rounded-t-lg`}
        >
          {stageName}
          {/* <button onClick={() => handleDelete(id)} className="ml-auto text-lg">
            ❌
          </button> */}
          <button
            onClick={() => handleDelete(id, boxId)}
            className="ml-auto text-lg"
          >
            ❌
          </button>

          <ConnectPointsWrapper {...{ boxId, handler, dragRef, boxRef }} />
        </div>
        {/* <p className="p-2">{text}</p> */}
        <textarea
          className="p-2"
          value={text}
          onChange={(e) => handleTextChange(e.target.value, id)}
          placeholder="Enter text here..."
        />
        {/* Amplify button */}
        <button
          className="absolute bottom-2 right-2 text-lg"
          onClick={() => setOpen((o) => !o)}
        >
          +
        </button>
        <Popup open={open} closeOnDocumentClick onClose={closeModal}>
          {/* Popup content here, you can use the same structure as the given Popup code */}
          {(close) => (
            // <div className="modal w-96 p-5 bg-white rounded shadow-lg text-gray-700 whitespace-normal">
            // <div className="p-5 bg-white rounded shadow-lg text-gray-700 w-96 min-h-[150px]">
            <div className="modal w-[600px] p-5 bg-white rounded shadow-lg text-gray-700 ">
              <button
                className="text-black absolute top-0 right-0 mt-4 mr-4"
                onClick={close}
              >
                &times;
              </button>
              <div className="text-lg border-b border-gray-200 pb-2 mb-2">
                {stageName}
              </div>
              {/* <div className="mb-4">{text}</div> */}
              <div className="mb-4 text-sm overflow-auto">{text}</div>
              {/* Comment section */}
              {showCommentBox && (
                <div>
                  <textarea
                    className="comment-box w-full p-2 mb-2" // Set the width to full
                    placeholder="Type your comment here..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                  ></textarea>
                  <button
                    className="bg-blue-500 text-white font-bold py-1 px-2 rounded text-sm"
                    onClick={() => handleSaveComment(commentText)}
                  >
                    Save
                  </button>
                </div>
              )}
              <div className="comments-section">
                {comments.map((comment) => (
                  <CommentComponent key={comment.id} comment={comment} />
                ))}
              </div>

              <div className="flex justify-center space-x-2 mt-2">
                <button
                  className="bg-red-500 text-white font-bold py-2 px-2 rounded"
                  onClick={() => setShowCommentBox(!showCommentBox)}
                >
                  Comment
                </button>
                <button
                  className="bg-red-500 text-white font-bold py-2 px-2 rounded"
                  onClick={() => {
                    console.log("modal closed ");
                    close();
                  }}
                >
                  Close Modal
                </button>
              </div>
            </div>
          )}
        </Popup>
      </div>
    </Draggable>
  );
}
