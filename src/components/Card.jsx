// Card.jsx
import React from "react";
import { ItemTypes } from "./Constants";
import { useState } from "react";

/**
 * Your Component
 */
export default function Card({ id, handleDelete, text, provided }) {

  // const [text, setText] = useState("");

  return (
    <div
      className="rounded-lg border-2 p-2 border-black w-full mb-2 h-28 relative"
      {...provided.dragHandleProps} {...provided.draggableProps} ref={provided.innerRef}
    >
      <textarea
        placeholder="Enter text here"
        value={text}
        // onChange={(event) => setText(event.target.value)}
        className="w-full h-full"
      />
      <button
        onClick={() => handleDelete(id)}
        className="absolute top-0 right-0 m-1 text-lg"
      >
        ❌
      </button>
    </div>
  );
}
