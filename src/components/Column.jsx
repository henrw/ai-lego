// // Column.jsx
// import React, { useState } from "react";
// import Card from "./Card";
// import { DragDropContext, Draggable, Droppable } from "react-beautiful-dnd";
// import Xarrow, { useXarrow, Xwrapper } from "react-xarrows";

// const Column = ({ stage }) => {
//   const [cards, setCards] = useState(["test1", "test2", "test3"]);

//   const addCard = () => {
//     const newCards = [...cards, ""];
//     setCards(newCards);
//   };

//   const handleDelete = (id) => {
//     const newCards = cards.filter((_, index) => index !== id);
//     setCards(newCards);
//   };

//   const handleDragDrop = (result) => {
//     const { source, destination, type } = result;
//     if (
//       !destination ||
//       (source.droppableId === destination.droppableId &&
//         source.index === destination.index)
//     )
//       return;
//     if (type === "group") {
//       const reorderedCards = [...cards];
//       const destinationIdx = destination.index;

//       const [removedCard] = reorderedCards.splice(source.index, 1);
//       reorderedCards.splice(destinationIdx, 0, removedCard);

//       return setCards(reorderedCards);
//     }
//   };

//   const updateLine = useXarrow();
//   return (
//     <div className="flex flex-col items-center h-full bg-white rounded-lg p-2">
//       <Xwrapper>
//         <DragDropContext onDragEnd={handleDragDrop}>
//           <p className="font-bold h-20">{stage}</p>
//           <Droppable
//             className="card-collector w-full"
//             droppableId={`${stage}-drop`}
//             type="group"
//           >
//             {(provided) => (
//               <div {...provided.droppableProps} ref={provided.innerRef}>
//                 {cards.map((_, idx) => (
//                   <Draggable
//                     onClick={updateLine}
//                     onDragEnd={updateLine}
//                     draggableId={`${stage}-${idx}-drag`}
//                     key={`${stage}-card-${idx}`}
//                     index={idx}
//                   >
//                     {(provided) => (
//                       <Card
//                         key={`${stage}-card-${idx}`}
//                         id={idx}
//                         provided={provided}
//                         handleDelete={handleDelete}
//                         text={_}
//                       />
//                     )}
//                   </Draggable>
//                 ))}
//                 {/* {provided.placeholder} */}
//               </div>
//             )}
//           </Droppable>
//         </DragDropContext>
//         <Xarrow start={1} end={2} />
//       </Xwrapper>

//       <button className="text-lg mt-auto" onClick={addCard}>
//         ➕
//       </button>
//     </div>
//   );
// };

// export default Column;
