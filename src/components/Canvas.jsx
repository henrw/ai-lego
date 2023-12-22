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
    <div className="flex flex-row ">
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
          color="#9CAFB7"
        />
      ))}

      <div className="flex flex-col left-[1%] absolute">
        <p className="font-bold text-lg">Templates:</p>
        <button
          onClick={() => addTemplate("empty")}
          className="bg-red-400 rounded-lg p-0.5 my-1"
        >
          Clear
        </button>
        <button
          onClick={() => addTemplate("8-stage")}
          className="bg-cardet-gray rounded-lg p-0.5 my-1"
        >
          8 Stages
        </button>
        <button
          onClick={() => addTemplate("6-stage")}
          className="bg-sage rounded-lg p-0.5 my-1"
        >
          6 Stages
        </button>
        <button
          onClick={() => addTemplate("3-stage")}
          className="bg-citron rounded-lg p-0.5 my-1"
        >
          3 Stages
        </button>
        <br></br>
        <p className="font-bold text-lg">Stages:</p>
        <button
          onClick={() => addCardData("problem")}
          className="bg-problem rounded-lg p-0.5 my-1"
        >
          Problem
        </button>
        <button
          onClick={() => addCardData("task")}
          className="bg-task rounded-lg p-0.5 my-1"
        >
          Task
        </button>
        <button
          onClick={() => addCardData("data")}
          className="bg-data rounded-lg p-0.5 my-1"
        >
          Data
        </button>
        <button
          onClick={() => addCardData("model")}
          className="bg-model rounded-lg p-0.5 my-1"
        >
          Model
        </button>
        <button
          onClick={() => addCardData("train")}
          className="bg-train rounded-lg p-0.5 my-1"
        >
          Train
        </button>
        <button
          onClick={() => addCardData("test")}
          className="bg-test rounded-lg p-0.5 my-1"
        >
          Test
        </button>
        <button
          onClick={() => addCardData("deploy")}
          className="bg-deploy rounded-lg p-0.5 my-1"
        >
          Deploy
        </button>
        <button
          onClick={() => addCardData("feedback")}
          className="bg-feedback rounded-lg p-0.5 my-1"
        >
          Feedback
        </button>
      </div>
    </div>

    // </DndProvider>
  );
};

export default Canvas;
