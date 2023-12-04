import Canvas from "./components/Canvas";
import Menu from "./components/Menu";
import { useState } from "react";
import { DndContext } from "@dnd-kit/core";

import { useDroppable } from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";

function Droppable(props) {
  const { isOver, setNodeRef } = useDroppable({
    id: "droppable",
  });
  const style = {
    color: isOver ? "green" : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} className="w-300 h-300">
      {props.children}
    </div>
  );
}

function Draggable(props) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: "draggable",
  });
  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <button ref={setNodeRef} style={style} {...listeners} {...attributes}>
      {props.children}
    </button>
  );
}

const App = () => {
  const [isDropped, setIsDropped] = useState(false);
  const draggableMarkup = <Draggable>Drag me</Draggable>;
  return (
    <div className="flex h-[calc(100vh-112px)]">
      <div className="flex-none w-fit">
        <Menu />
      </div>
      <div className="flex-auto bg-gray-200 p-4">
        <Canvas />
      </div>
    </div>
  );
};

export default App;
