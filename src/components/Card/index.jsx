import React, { useRef, useState, useEffect } from "react";
import { ItemTypes } from "../Constants";
import Draggable from "react-draggable";
import Xarrow from "react-xarrows";
import useMyStore from "../../contexts/context";
import { shallow } from "zustand/shallow";
import Popup from "reactjs-popup";
import { v4 as uuidv4 } from "uuid";
import { FaSave } from "react-icons/fa";
import { FaEdit } from "react-icons/fa";

const ConnectPointsWrapper = ({ boxId, handler, dragRef, boxRef }) => {
  const ref1 = useRef();

  const [position, setPosition] = useState({});
  const [beingDragged, setBeingDragged] = useState(false);

  return (
    <React.Fragment>
      <div
        className="connectPoint top-[calc(50%-7.5px)] right-0 absolute w-2 h-2 rounded-full bg-black"
        style={{
          ...position,
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
          color="black"
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
  feedback: "feedback",
};

const getBorderColorClassFromId = (id) => {
  const stageName = id.split("-")[0];
  return `border-${colorClasses[stageName]}`; // This will return something like "border-red-500"
};

const getBgColorClassFromId = (id) => {
  const stageName = id.split("-")[0];
  return `bg-${colorClasses[stageName]}`;
};

const CommentComponent = ({
  comment,
  handleReplyToComment,
  level = 0,
  allComments,
}) => {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState("");

  const submitReply = () => {
    handleReplyToComment(comment.id, replyText);
    setReplyText("");
    setShowReplyInput(false);
  };

  // Find child comments for the current comment
  const childComments = allComments.filter((c) => c.parentId === comment.id);

  return (
    <div>
      <div className={`ml-${level * 2} mt-2 border-l-2 border-gray-300 pl-4`}>
        <div className="comment p-2">
          <p>{comment.text}</p>
          <button
            className="text-blue-500 hover:text-blue-700 text-sm font-semibold"
            onClick={() => setShowReplyInput(!showReplyInput)}
          >
            Reply
          </button>
          {showReplyInput && (
            <div className="mt-2">
              <textarea
                className="w-full border border-gray-300 p-2 mb-2 rounded"
                placeholder="Type your reply here..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
              />
              <button
                className="text-white bg-blue-500 hover:bg-blue-700 font-bold py-1 px-2 rounded text-sm"
                onClick={submitReply}
              >
                Post Reply
              </button>
            </div>
          )}
        </div>
        {childComments.map((childComment) => (
          <CommentComponent
            key={childComment.id}
            comment={childComment}
            handleReplyToComment={handleReplyToComment}
            level={level + 1}
            allComments={allComments}
          />
        ))}
      </div>
    </div>
  );
};
export default function Card({ id, handleDelete, text, handler, boxId }) {
  const borderColorClass = getBorderColorClassFromId(id);
  const bgColorClass = getBgColorClassFromId(id);
  const cardData = useMyStore(
    (store) => store.cardsData.filter((cardData) => cardData.id === id)[0],
    shallow
  );
  // Extract the stage description from cardData

  const prompt = cardData ? cardData.prompt : "No prompt available";
  const setCardPosition = useMyStore((store) => store.setCardPosition);
  const dragRef = useRef();
  const boxRef = useRef();

  const renderStageNameTrigger = () => (
    <div className={`${bgColorClass} p-1 py-0 rounded text-center text-sm`}>
      {stageName}
    </div>
  );
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

  const handleReplyToComment = (parentId, replyText) => {
    if (!replyText) return; // Don't add empty replies

    const newReply = {
      id: uuidv4(),
      text: replyText,
      parentId,
      childComments: [],
    };

    /// Add newReply to comments state
    setComments((currentComments) => {
      const updatedComments = [...currentComments, newReply];
      return updatedComments;
    });
  };

  // Add state to control the visibility of the popup
  const [showSmallCommentBox] = useState(true); // New state for small comment box

  // State to keep track of comment boxes
  const [hasComments, setHasComments] = useState(false);
  const [commentBoxes, setCommentBoxes] = useState([]);
  const [open, setOpen] = useState(false);
  const closeModal = () => setOpen(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [showComments, setShowComments] = useState(true);

  // Function to toggle the visibility of the comment boxes
  const toggleCommentsVisibility = () => {
    setShowComments(!showComments);
  };

  // Function to add a new comment box
  const addCommentBox = () => {
    setCommentBoxes(commentBoxes.concat({ id: uuidv4(), text: "" }));
    if (!hasComments) {
      setHasComments(true);
    }
  };

  // Function to update the text of a specific comment box
  const updateCommentBoxText = (id, text) => {
    setCommentBoxes(
      commentBoxes.map((box) => (box.id === id ? { ...box, text } : box))
    );
  };

  // Add a Tailwind CSS class for fixed width and flexible height
  const cardClass = "relative bg-gray-200 rounded shadow p-2 w-60";

  // This function handles saving new comments and editing existing ones.
  const handleSaveComment = (input) => {
    // Regular expression to check if the input is a UUID
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const isUuid = uuidRegex.test(input);

    // If the input is a UUID, we assume it's a boxId and handle saving a comment linked to a specific comment box
    if (isUuid) {
      const boxIndex = commentBoxes.findIndex((box) => box.id === input);
      if (boxIndex === -1) return; // If boxId is not found, exit the function

      const box = commentBoxes[boxIndex];
      if (box && box.text.trim()) {
        if (box.isEditing && box.commentId) {
          // Editing existing comment
          setComments((currentComments) =>
            currentComments.map((comment) =>
              comment.id === box.commentId
                ? { ...comment, text: box.text }
                : comment
            )
          );
        } else {
          // Saving new comment linked to a comment box
          const newComment = {
            id: uuidv4(),
            text: box.text,
            parentId: null,
            childComments: [],
          };
          setComments((currentComments) => [...currentComments, newComment]);
        }
        // Clear the text in the comment box and reset its editing state
        const updatedBoxes = [...commentBoxes];
        updatedBoxes[boxIndex] = { ...box, isEditing: false, text: box.text };
        setCommentBoxes(updatedBoxes);
        // setHasComments(comments.length > 0);
      }
    } else {
      const text = input;
      if (text.trim()) {
        const newComment = {
          id: uuidv4(),
          text: text,
          parentId: null, // Top-level comment has no parent
          childComments: [],
        };
        setComments((currentComments) => [...currentComments, newComment]);
        // setHasComments(comments.length > 0);

        const newCommentBox = {
          id: uuidv4(), // Unique ID for the new comment box
          text: commentText, // The text of the comment
          isEditing: false, // The new box is not in edit mode by default
        };
        // Update the commentBoxes state to include the new comment box
        setCommentBoxes((currentBoxes) => [...currentBoxes, newCommentBox]);

        // Optionally, clear the comment input field in the modal
        setCommentText("");
      }
    }
  };

  // This function toggles edit mode for a comment box
  const toggleEdit = (boxId, commentId = null) => {
    const boxIndex = commentBoxes.findIndex((box) => box.id === boxId);
    if (boxIndex === -1) return;

    const updatedBoxes = [...commentBoxes];
    const box = updatedBoxes[boxIndex];

    // Toggle the isEditing state and set commentId if provided
    updatedBoxes[boxIndex] = {
      ...box,
      isEditing: !box.isEditing,
      commentId: commentId ?? box.commentId, // Keep the same commentId if not provided
    };
    setCommentBoxes(updatedBoxes);
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
        className={`absolute bg-gray-200 rounded shadow p-2 ${
          showComments ? "" : "min-h-[100px]"
        } `} // w-96 for fixed width
        id={boxId}
        ref={boxRef}
        style={{ paddingBottom: "0" }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          console.log(e.dataTransfer.getData("arrow"));
          if (e.dataTransfer.getData("arrow") != boxId) {
            const refs = { start: e.dataTransfer.getData("arrow"), end: boxId };
            addArrow(refs);
          }
        }}
      >
        <button
          onClick={() => handleDelete(id, boxId)}
          className="absolute top-0 right-0 text p-1"
        >
          ❌
        </button>
        <div className={`absolute top-1 left-1 `}>
          <Popup
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
              {/* Content of your hover box */}

              <span>{prompt}</span>
            </div>
          </Popup>
        </div>

        <ConnectPointsWrapper {...{ boxId, handler, dragRef, boxRef }} />

        <div className="mt-4">
          <textarea
            className="p-3"
            value={text}
            onChange={(e) => handleTextChange(e.target.value, id)}
            placeholder="Enter text here..."
          />
          <div className="text-lg -mt-2 ">
            {/* Negative margin to p */}
            <button className="pr-1" onClick={addCommentBox}>
              💬
            </button>

            <button
              className="pr-1"
              onClick={() => {
                console.log("Button clicked, current state:", open);
                setOpen((o) => !o);
              }}
            >
              🔍
            </button>

            {hasComments && (
              <button onClick={toggleCommentsVisibility}>
                {showComments ? "⬆️" : "⬇️"}
              </button>
            )}
          </div>

          {/* Render comment boxes */}
          {showComments &&
            commentBoxes.map((box) => (
              <div key={box.id} className="flex items-center space-x-1">
                <textarea
                  className="block p-1 w-full lg:w-5/6 border-gray-300 rounded mb-2"
                  placeholder="Add a comment..."
                  value={box.text}
                  onChange={(e) => updateCommentBoxText(box.id, e.target.value)}
                  disabled={!box.isEditing}
                />
                {box.isEditing ? (
                  <button
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-1 rounded text-sm "
                    onClick={() => handleSaveComment(box.id)}
                  >
                    <FaSave />
                  </button>
                ) : (
                  <button
                    className="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-1 rounded text-sm  "
                    onClick={() => toggleEdit(box.id, box.commentId)}
                  >
                    <FaEdit />
                  </button>
                )}
              </div>
            ))}

          <Popup open={open} closeOnDocumentClick onClose={closeModal}>
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
                {/* Comment section */}

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

                <div className="flex justify-center space-x-2 mt-2"></div>
              </div>
            )}
          </Popup>
        </div>
      </div>
    </Draggable>
  );
}
