import React, { useEffect } from "react";
import Card from "./Card";
import Column from "./Column";
import { useState } from "react";
import useMyStore, { prompts, colorClasses } from "../../contexts/projectContext";
import Xarrow from "react-xarrows";
import { useParams } from 'react-router-dom';
import EvaluationPanel from "./Evaluation";
import CollaboratorModal from "./CollaboratorModal";
import MiniMap from "./MiniMap";


const Canvas = () => {

  // Collaborator modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const openModal = () => {
    setIsModalOpen(true);
  };
  const closeModal = () => {
    setIsModalOpen(false);
  };

  const getBgColorClassFromId = (stage) => {
    const bgColorClass = `bg-${colorClasses[stage]}`;
    return bgColorClass;
  };

  const { projectId } = useParams();
  const linksPath = "smooth";

  const [hovered, setHovered] = useState("");
  const [hoverY, setHoverY] = useState(0);

  const cardsData = useMyStore((store) => store.cards);
  const projectName = useMyStore((store) => store.projectName);
  const links = useMyStore((store) => store.links);

  const addTemplate = useMyStore((store) => store.addTemplate);
  const canvasScale = useMyStore((store) => store.canvasScale);
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

  console.log("Canvas rendering", canvasScale);

  return (
    // <div className="flex flex-row ">
    <div style={{width: `${canvasScale.x * 100}vw`, height: `${canvasScale.y * 100}vh`, paddingTop: '4rem', position: 'relative' }} className="sketchbook-background">

      {cardsData.map((card) => (
        <Card
          id={card.uid}
          key={card.uid}
          stage={card.stage}
          //   handleDelete={() => {}}
          comments={card.comments}
          handleDelete={handleDelete}
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
          endAnchor={"left"}
          key={ar.start + "." + ar.end}
          labels={""}
          color="#9CAFB7"
        />
      ))}

      <div className="flex flex-row fixed mt-4 left-0 mb-4 ml-4 flex flex-col">
        <input
          type="text"
          className="p-2 border-2"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          onBlur={() => { }} // TODO optimize firebase update if necessary
          placeholder="Enter Project Name"
        />
        <button
          onClick={openModal}
          className="ml-1 bg-blue-500 hover:bg-blue-700 text-white py-2 px-3 rounded">
          Share
        </button>
      </div>

      <CollaboratorModal isOpen={isModalOpen} onClose={closeModal} />

      <EvaluationPanel />

      <MiniMap />


      <div className="fixed bottom-0 left-0 mb-4 ml-4">
        <div className="flex flex-row">
          <div className="flex flex-col">
            <p className="font-bold text-lg">Stages:</p>
            {
              ["problem", "task", "data", "model", "train", "test", "deploy", "feedback", "➕"].map((stage, index) => (
                <button
                  key={index}
                  onClick={() => addCardData(stage)}
                  onMouseEnter={(e) => {
                    const rect = e.target.getBoundingClientRect();
                    const topPosition = rect.top + window.pageYOffset;
                    setHovered(stage);
                    setHoverY(topPosition);
                  }}
                  onMouseLeave={() => {
                    setHovered("");
                  }}
                  className={`rounded-lg w-[90px] p-1 my-1 ${stage === 'problem' ? 'bg-problem' :
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
          </div>
          <div
            className={`h-min w-[300px] rounded-lg bg-black text-white text-center fixed left-[100px] z-[1001] transition-opacity duration-300 ${hovered !== "" ? "visible opacity-100" : "invisible opacity-0"}`}
            style={{
              top: `${hoverY}px`
            }}>
            {prompts[hovered]}
          </div>
        </div>
      </div>
    </div>

    // </DndProvider>
  );
};

export default Canvas;
