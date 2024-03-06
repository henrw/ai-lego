import React, { useEffect } from "react";
import Card from "./Card";
import Column from "./Column";
import { useState } from "react";
import useMyStore from "../contexts/projectContext";
import Xarrow from "react-xarrows";
import { useParams } from 'react-router-dom';
import EvaluationPanel from "./Evaluation";


const Canvas = () => {
  const { projectId } = useParams();
  const linksPath = "smooth";

  const cardsData = useMyStore((store) => store.cards);
  const projectName = useMyStore((store) => store.projectName);
  const links = useMyStore((store) => store.links);

  const addTemplate = useMyStore((store) => store.addTemplate);
  const addCardData = useMyStore((store) => store.addCardData);
  const pullProject = useMyStore((store) => store.pullProject);
  const cleanStore = useMyStore((store) => store.cleanStore);
  const setProjectName = useMyStore((store) => store.setProjectName);

  // Add a function to handle delete action
  const handleDelete = (cardId) => {
    // Call store action to delete the card and associated links
    useMyStore.getState().deleteCardAndLinks(cardId);
  };

  useEffect(() => {
    cleanStore(projectId);
    pullProject(projectId);
  }, [pullProject, projectId]);

  console.log("Canvas rendering");

  return (
    // <div className="flex flex-row ">
    <div className="relative pt-16 sketchbook-background">
      {cardsData.map((card) => (
        <Card
          id={card.uid}
          stage={card.stage}
          //   handleDelete={() => {}}
          comments={card.comments}
          handleDelete={handleDelete}
          key={card.uid}
          text={card.description}
          {...{ handler: "right" }}
          cardId={"" + card.id}
        />
      ))}

      {links.map((ar, idx) => (
        <Xarrow
          className="arrow"
          path={linksPath}
          start={ar.start}
          end={ar.end}
          startAnchor={"right"}
          // endAnchor={"left"}
          key={ar.start + "." + ar.end}
          labels={""}
          color="#9CAFB7"
        />
      ))}

      <div className="fixed mt-4 left-0 mb-4 ml-4 flex flex-col">
        <input
          type="text"
          className="p-2 font-bold border-2"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          onBlur={()=>{}} // TODO optimize firebase update if necessary
          placeholder="Enter Project Name"
        />
      </div>

      <EvaluationPanel />

      <div className="fixed bottom-0 left-0 mb-4 ml-4 flex flex-col">
        {/* <p className="font-bold text-lg">Templates:</p>
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
        <br></br> */}

        <p className="font-bold text-lg">Stages:</p>
        {
          ["problem", "task", "data", "model", "train", "test", "deploy", "feedback", "➕"].map((stage, index) => (
            <button
              key={index}
              onClick={() => addCardData(stage)}
              className={`rounded-lg p-1 my-1 ${stage === 'problem' ? 'bg-problem' :
                  stage === 'task' ? 'bg-task' :
                    stage === 'data' ? 'bg-data' :
                      stage === 'model' ? 'bg-model' :
                        stage === 'train' ? 'bg-train' :
                          stage === 'test' ? 'bg-test' :
                            stage === 'deploy' ? 'bg-deploy' :
                              stage === 'feedback' ? 'bg-feedback' : 'bg-default'                              
                }`}
            >
              {stage.charAt(0).toUpperCase() + stage.slice(1)}
            </button>
          ))
        }
        {/* <button
          onClick={() => addCardData("design")}
          className="bg-design"
        ></button>
        <button
          onClick={() => addCardData("develop")}
          className="bg-develop"
        ></button>{" "}
        <button
          onClick={() => addCardData("modelEvaluation")}
          className="bg-modelEva"
        ></button>
        <button
          onClick={() => addCardData("modelDevelopment")}
          className="bg-modelDev"
        ></button>
        <button
          onClick={() => addCardData("MLOps")}
          className="bg-MLOps"
        ></button>
        <button
          onClick={() => addCardData("problemDef")}
          className="bg-problemDef"
        ></button> */}
      </div>
    </div>

    // </DndProvider>
  );
};

export default Canvas;
