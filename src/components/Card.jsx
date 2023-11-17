// Card.jsx
import React from "react";
import { useDrag } from "react-dnd";
import { ItemTypes } from "./Constants";
import { useState } from "react";

/**
 * Your Component
 */
export default function Card({ id, handleDelete, isDragging }) {
  const [{ opacity }, dragRef] = useDrag(
    () => ({
      type: ItemTypes.CARD,
      item: { id },
      collect: (monitor) => ({
        opacity: monitor.isDragging() ? 0.5 : 1,
      }),
    }),
    [id]
  );

  const [text, setText] = useState("");

  return (
    <div
      ref={dragRef}
      style={{ opacity }}
      className="rounded-lg border-2 p-2 border-black w-full my-2 h-28 relative"
    >
      <textarea
        placeholder="Enter text here"
        value={text}
        onChange={(event) => setText(event.target.value)}
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
