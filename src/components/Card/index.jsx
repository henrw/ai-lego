// Card.jsx
import React, { useRef, useState } from "react";
import { ItemTypes } from "../Constants";
import Draggable from "react-draggable";
import Xarrow from 'react-xarrows';
import useMyStore from "../../context";
import { shallow } from 'zustand/shallow';
/**
 * Your Component
 */

const getStageColor = (id) => {
  const stage = id.split("_")[0]
  console.log(stage);
}


const ConnectPointsWrapper = ({ boxId, handler, dragRef, boxRef }) => {
  const ref1 = useRef();

  const [position, setPosition] = useState({});
  const [beingDragged, setBeingDragged] = useState(false);
  return (
    <React.Fragment>
      <div
        className="connectPoint top-[calc(50%-7.5px)] right-0 absolute w-4 h-4 rounded-full bg-black"
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
        <Xarrow path="straight" start={boxId} startAnchor={"right"} end={ref1} />
      ) : null}
    </React.Fragment>
  );
};

export default function Card({ id, handleDelete, text, handler, boxId }) {

  // const [text, setText] = useState("");

  const cardData = useMyStore((store) => (
    store.cardsData.filter((cardData) => cardData.id === id)[0]
  ), shallow)

  const setCardPosition = useMyStore((store) => (
    store.setCardPosition
  ))
  const dragRef = useRef();
  const boxRef = useRef();

  const handleStop = (event, dragElement) => {
    setCardPosition(dragElement.node.id, { x: dragElement.x, y: dragElement.y });
  };

  const addArrow = useMyStore((store) => store.addArrow);
  const refreshArrows = useMyStore((store) => store.refreshArrows);

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
        className="rounded-lg flex flex-col bg-white w-40 h-28"
        id={boxId}
        ref={boxRef}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          console.log(e.dataTransfer.getData("arrow"))
          if (e.dataTransfer.getData("arrow") != boxId) {
            const refs = { start: e.dataTransfer.getData("arrow"), end: boxId };
            addArrow(refs);
          }
        }}
      >
        <div className={`text-lg flex flex-row font-bold bg-${id.split('-')[0]} p-2 rounded-t-lg`}>
          <p>{id.split('-')[0].charAt(0).toUpperCase() + id.split('-')[0].slice(1)}</p>
          <button
            onClick={() => handleDelete(id)}
            className="ml-auto text-lg"
          >
            ❌
          </button>

          <ConnectPointsWrapper {...{ boxId, handler, dragRef, boxRef }} />
        </div>
        <p className="p-2">{text}</p>
      </div>
    </Draggable>

  );
}
