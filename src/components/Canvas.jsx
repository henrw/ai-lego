import React from "react";
import Card from "./Card";
import Column from "./Column";
import { useState } from "react";
import useMyStore from "../contexts/context";
import Xarrow from "react-xarrows";

const Canvas = () => {
  const arrowsPath = "smooth";

  const cardsData = useMyStore((store) => store.cardsData);
  const arrows = useMyStore((store) => store.arrows);

  const addTemplate = useMyStore((store) => store.addTemplate);
  const addCardData = useMyStore((store) => store.addCardData);

  //   // Add a function to handle delete action
  const handleDelete = (cardId, boxId) => {
    // Call store action to delete the card and associated arrows
    useMyStore.getState().deleteCardAndArrows(cardId, boxId);
  };

  console.log("Canvas rendering");

  return (
    // <DndProvider backend={HTML5Backend}>
    <div className="flex flex-row w-full h-full">
      {cardsData.map((card) => (
        <Card
          id={card.id}
          //   handleDelete={() => {}}
          handleDelete={handleDelete}
          key={card.id}
          text={card.descr}
          position={card.canvasData}
          {...{ handler: "right" }}
          boxId={"" + card.id}
        />
      ))}

      {arrows.map((ar, idx) => (
        <Xarrow
          className="arrow"
          path={arrowsPath}
          start={ar.start}
          end={ar.end}
          startAnchor={"right"}
          // endAnchor={"left"}
          key={ar.start + "." + ar.end}
          labels={""}
        />
      ))}

      <div className="flex flex-col right-[1%] bottom-[1%] absolute">
        <p className="font-bold text-lg">Templates:</p>
        <button
          onClick={() => addTemplate("empty")}
          className="bg-red-400 rounded-lg p-2 my-2"
        >
          Clear
        </button>
        <button
          onClick={() => addTemplate("8-stage")}
          className="bg-cardet-gray rounded-lg p-2 my-2"
        >
          8 Stages
        </button>
        <button
          onClick={() => addTemplate("6-stage")}
          className="bg-sage rounded-lg p-2 my-2"
        >
          6 Stages
        </button>
        <button
          onClick={() => addTemplate("3-stage")}
          className="bg-citron rounded-lg p-2 my-2"
        >
          3 Stages
        </button>
        <br></br>
        <p className="font-bold text-lg">Stages:</p>
        <button
          onClick={() => addCardData("problem")}
          className="bg-problem rounded-lg p-2 my-2"
        >
          Problem
        </button>
        <button
          onClick={() => addCardData("task")}
          className="bg-task rounded-lg p-2 my-2"
        >
          Task
        </button>
        <button
          onClick={() => addCardData("data")}
          className="bg-data rounded-lg p-2 my-2"
        >
          Data
        </button>
        <button
          onClick={() => addCardData("model")}
          className="bg-model rounded-lg p-2 my-2"
        >
          Model
        </button>
        <button
          onClick={() => addCardData("train")}
          className="bg-train rounded-lg p-2 my-2"
        >
          Train
        </button>
        <button
          onClick={() => addCardData("test")}
          className="bg-test rounded-lg p-2 my-2"
        >
          Test
        </button>
        <button
          onClick={() => addCardData("deploy")}
          className="bg-deploy rounded-lg p-2 my-2"
        >
          Deploy
        </button>
        <button
          onClick={() => addCardData("feedback")}
          className="bg-feedback rounded-lg p-2 my-2"
        >
          Feedback
        </button>
      </div>
    </div>

    // </DndProvider>
  );
};

export default Canvas;
