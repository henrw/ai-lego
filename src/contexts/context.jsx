import { produce } from "immer";
// Import the suggested function from Zustand
import { createWithEqualityFn } from "zustand/traditional";
import { devtools, persist, createJSONStorage } from "zustand/middleware";

const cardsDatatemplates = {
  "8-stage": {
    cardsData: [
      {
        id: "problem-0",
        descr: "",
        details: {},

        position: { x: 100, y: 0 },
      },
      {
        id: "task-0",
        descr: "",
        details: {},
        position: { x: 200, y: 0 },
      },
      {
        id: "data-0",
        descr: "",
        details: {},

        position: { x: 300, y: 0 },
      },
      {
        id: "model-0",
        descr: "",
        details: {},
        prompt: "",
        position: { x: 400, y: 0 },
      },
      {
        id: "train-0",
        descr: "",
        details: {},
        position: { x: 500, y: 0 },
      },
      {
        id: "test-0",
        descr: "",
        details: {},
        position: { x: 600, y: 0 },
      },
      {
        id: "deploy-0",
        descr: "",
        details: {},

        position: { x: 700, y: 0 },
      },
      {
        id: "feedback-0",
        descr: "",
        details: {},

        position: { x: 800, y: 0 },
      },
    ],
    arrows: [
      { start: "problem-0", end: "task-0" },
      { start: "task-0", end: "data-0" },
      { start: "data-0", end: "model-0" },
      { start: "model-0", end: "train-0" },
      { start: "train-0", end: "test-0" },
      { start: "test-0", end: "deploy-0" },
      { start: "deploy-0", end: "feedback-0" },
    ],
  },
  "6-stage": {
    cardsData: [
      {
        id: "problemDef-0",
        descr: "",
        details: {},
        position: { x: 100, y: 0 },
      },
      {
        id: "data-0",
        descr: "",
        details: {},
        position: { x: 200, y: 0 },
      },
      {
        id: "modelDevelopment-0",
        descr: "",
        details: {},
        position: { x: 300, y: 0 },
      },
      {
        id: "modelEvaluation-0",
        descr: "",
        details: {},
        position: { x: 400, y: 0 },
      },
      {
        id: "deploy-0",
        descr: "",
        details: {},
        position: { x: 500, y: 0 },
      },
      {
        id: "MLOps-0",
        descr: "",
        details: {},
        position: { x: 600, y: 0 },
      },
    ],
    arrows: [
      { start: "problemDef-0", end: "data-0" },
      { start: "data-0", end: "modelDevelopment-0" },
      { start: "modelDevelopment-0", end: "modelEvaluation-0" },
      { start: "modelEvaluation-0", end: "deploy-0" },
      { start: "deploy-0", end: "MLOps-0" },
    ],
  },
  "3-stage": {
    cardsData: [
      {
        id: "design-0",
        descr: "",
        details: {},
        position: { x: 100, y: 0 },
      },
      {
        id: "develop-0",
        descr: "",
        details: {},
        position: { x: 200, y: 0 },
      },
      {
        id: "deploy-0",
        descr: "",
        details: {},
        position: { x: 300, y: 0 },
      },
    ],
    arrows: [
      { start: "design-0", end: "develop-0" },
      { start: "develop-0", end: "deploy-0" },
    ],
  },
};

const prompts = {
  problem:
    "Brief the problem or challenge that can be solved by AI in simple words, highlighting its significance and potential impact on target users or stakeholders.",
  task: "Explain how AI focuses on the specific task that aims to solve the problem.",
  data: "Describe how the data for training the AI system is collected and prepared in plain language, emphasizing the data preprocessing and any feature engineering technologies that are applied to the raw data.",
  model:
    "Explain what AI model architecture and algorithms are being used and  and their respective roles in simple terms.",
  train:
    "Describe how the AI model learns from the data, and clarify the process of how it improves its performance.",
  test: "Explain how the AI model is evaluated and assessed for its effectiveness and accuracy, using plain words to highlight the testing process.",
  deploy:
    "Describe how the AI system is deployed in practical use, emphasizing the benefits and potential impact on users or stakeholders.",
  feedback:
    "Explain how feedback is gathered from users or stakeholders to improve the AI system and highlight how it helps the iteration of AI development.",
};
const myStore = (set) => ({
  cardsData: [],
  arrows: [],
  uuid: 0,

  addCardData: (stage) =>
    set(
      produce((store) => {
        // Increment the UUID for the new card
        store.uuid += 1;
        // Find the rightmost card's x position
        const rightmostX = store.cardsData.reduce(
          (max, card) => Math.max(card.position.x, max),
          0
        );
        // Calculate the new card's position, 150 units to the right of the rightmost card
        const newPosition = { x: 0 + rightmostX + 170, y: 0 };
        // Add the new card to the cardsData array
        store.cardsData.push({
          id: `${stage}-${store.uuid}`,
          descr: "",
          details: {},
          prompt: prompts[stage] || "No prompt available",
          position: newPosition,
        });
      }),
      false,
      "addCardData"
    ),

  // Add this action to your store
  updateCardText: (id, newText) =>
    set(
      produce((store) => {
        const cardToUpdate = store.cardsData.find((card) => card.id === id);
        if (cardToUpdate) {
          cardToUpdate.descr = newText;
        }
      })
    ),
  setCardPosition: (id, position) =>
    set(
      produce((store) => {
        store.cardsData.map((cardData) => {
          if (cardData.id === id) cardData.position = position;
        });
      })
    ),
  addArrow: (refs) =>
    set(
      produce((store) => {
        store.arrows.push(refs);
      })
    ),
  refreshArrows: () =>
    set(
      produce((store) => {
        store.arrows = [...store.arrows];
      })
    ),
  addTemplate: (type) =>
    set(
      produce((store) => {
        if (cardsDatatemplates[type]) {
          const updatedCardsData = cardsDatatemplates[type].cardsData.map(
            (card) => {
              const stageName = card.id.split("-")[0]; // Extract stage name from the id
              return {
                ...card,
                prompt: prompts[stageName] || "No prompt available", // Assign the corresponding prompt
              };
            }
          );

          store.cardsData = updatedCardsData;
          store.arrows = cardsDatatemplates[type].arrows;
        } else {
          store.cardsData = [];
          store.arrows = [];
        }
      })
    ),

  deleteCardAndArrows: (cardId, boxId) =>
    set((state) => {
      // Filter out the card from cardsData
      const newCardsData = state.cardsData.filter((card) => card.id !== cardId);
      // Filter out the arrows associated with the card
      const newArrows = state.arrows.filter(
        (arrow) => arrow.start !== boxId && arrow.end !== boxId
      );
      return { ...state, cardsData: newCardsData, arrows: newArrows };
    }),
});

const useMyStore = createWithEqualityFn(devtools(myStore));

export default useMyStore;
