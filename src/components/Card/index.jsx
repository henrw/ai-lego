// Card.jsx
import React, { useRef, useState } from "react";
// import { ItemTypes } from "../Constants";
import Draggable from "react-draggable";
import Xarrow from 'react-xarrows';
import useMyStore from "../../contexts/MyStore";
import { shallow } from 'zustand/shallow';
import useCanvasStore from "../../contexts/CanvasStore";
/**
 * Your Component
 */


const ConnectPointsWrapper = ({ boxId, handler, dragRef, boxRef }) => {
  const ref1 = useRef();

  const [hovered, setHovered] = useState(false);
  const [position, setPosition] = useState({});
  const [beingDragged, setBeingDragged] = useState(false);
  return (
    <React.Fragment>
      <div
        className={`connectPoint ${hovered? "top-[calc(50%-9.5px)] right-[-22px]" : "top-[calc(50%-7.5px)] right-[-20px]"} absolute ${hovered? "w-4 h-4" : "w-3 h-3"} rounded-full bg-sky-500`}
        style={{
          ...position,
        }}
        onMouseEnter={()=>{setHovered(true)}}
        onMouseLeave={()=>{setHovered(false)}}
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
  const isSelected = useCanvasStore(store => store.selectedCardId === id, shallow);
  const canvasActions = useCanvasStore(store => store.actions);

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

  const handleClick = (e) => {
    switch (e.detail) {
      case 1:
        isSelected ? canvasActions.unselectCard() : canvasActions.selectCardId(id);
        break;
      case 2:
        isSelected ? canvasActions.unselectCard() : canvasActions.selectCardId(id);
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
        className={`rounded-lg flex flex-col bg-white w-40 h-28 ${isSelected ? "outline outline-offset-1 outline-1 outline-sky-500" : ""} z-10`}
        id={boxId}
        ref={boxRef}
        onDragOver={(e) => e.preventDefault()}
        onKeyDown={(e) => { console.log(e.key) }}
        onClick={handleClick}
        onDrop={(e) => {
          if (e.dataTransfer.getData("arrow") != boxId) {
            const refs = { start: e.dataTransfer.getData("arrow"), end: boxId };
            addArrow(refs);
          }
        }}
      >
        <div className={`text-lg flex flex-row font-bold bg-${id.split('-')[0]} p-2 rounded-t-lg`}>
          <p>{id.split('-')[0].charAt(0).toUpperCase() + id.split('-')[0].slice(1)}</p>
        </div>
        <p className="p-2">{text}</p>

        {isSelected &&
          <React.Fragment>
            <div className="absolute left-0 top-[-25px]">
              <button
                onClick={() => { }}
                className="ml-auto text-sm"
              >
                ❌
              </button>
            </div>
            <ConnectPointsWrapper {...{ boxId, handler, dragRef, boxRef }} />
          </React.Fragment>
        }

      </div>
    </Draggable>

  );
}
