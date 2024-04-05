import { produce } from "immer";
// Import the suggested function from Zustand
import { createWithEqualityFn } from "zustand/traditional";
import { devtools, persist, createJSONStorage } from "zustand/middleware";
import { db } from "../firebase"; // Ensure you have this import
import { doc, getDoc, updateDoc, addDoc, collection, arrayUnion, query, where, getDocs, serverTimestamp, deleteDoc } from "firebase/firestore"; // Import Firestore document update functions

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

export const prompts = {
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

export const colorClasses = {
  problem: "problem",
  task: "task",
  data: "data",
  model: "model",
  train: "train",
  test: "test",
  deploy: "deploy",
  design: "design",
  develop: "develop",
  modelEvaluation: "modelEva",
  modelDevelopment: "modelDev",
  MLOps: "MLOps",
  feedback: "feedback",
  problemDef: "problemDef",
  "➕": "➕",
};

const myStore = (set) => ({
  projectName: "",
  projectId: "",
  cards: [],
  links: [],
  evaluations: [],
  canvasScale: { x: 1.1, y: 1.1 },
  isRescaled: false,

  extendCanvasRight: async () => {
    const {canvasScale} = useMyStore.getState();

    const totalPageWidth = document.documentElement.scrollWidth;
    const viewportWidth = window.innerWidth;
    set((state) => ({
      ...state,
      canvasScale: { x: totalPageWidth / viewportWidth, y: state.canvasScale.y },
      isRescaled: true,
    }));
    // window.scrollBy((totalPageWidth / viewportWidth - canvasScale.x) * viewportWidth, 0);
  },
  extendCanvasBottom: async () => {
    const {canvasScale} = useMyStore.getState();
    const totalPageHeight = document.documentElement.scrollHeight;
    const viewportHeight = window.innerHeight;
    set((state) => ({
      ...state,
      canvasScale: { x: state.canvasScale.x, y: totalPageHeight / viewportHeight },
      isRescaled: true,
    }));
    // window.scrollBy(0, (totalPageHeight / viewportHeight - canvasScale.y) * viewportHeight);
  },


  pullProject: async (projectId) => {
    const projectDocSnap = await getDoc(doc(db, "projects", projectId));
    if (!projectDocSnap.exists()) {
      // Creat new project
      console.error("Should never be called [Project not found");
      return;
    }

    const projectData = projectDocSnap.data();
    let cards = [];
    if (projectData.cards !== undefined) {
      const cardFetchPromises = projectData.cards.map(cardId =>
        getDoc(doc(db, "cards", cardId)).then(cardDocSnap => cardDocSnap.data())
      );
      cards = await Promise.all(cardFetchPromises);
      cards.sort((a, b) => b.createdAt - a.createdAt);


      for (const card of cards) {
        let comments = [];
        if (card.comments !== undefined) {
          const commentsFetchPromises = card.comments.map(commentId =>
            getDoc(doc(db, "comments", commentId)).then(commentDocSnap => commentDocSnap.data())
          );
          comments = await Promise.all(commentsFetchPromises);
        }
        card.comments = comments;
      };
    }
    let evaluations = [];
    if (projectData.evaluations !== undefined) {
      const evaluationFetchPromises = projectData.evaluations.map(evaluationId =>
        getDoc(doc(db, "evaluations", evaluationId)).then(evaluationDocSnap => evaluationDocSnap.data())
      );
      evaluations = await Promise.all(evaluationFetchPromises);
    }

    set(state => ({
      ...state,
      projectName: projectData.name,
      projectId: projectId,
      links: projectData.links,
      cards: cards,
      evaluations: evaluations,
      canvasScale: projectData.canvasScale || { x: 1.1, y: 1.1 },
      isRescaled: false,
    }));
  },

  addComment: async (username, cardId, text) => {
    const { projectId, cards } = useMyStore.getState();
    if (projectId == null) {
      throw new Error("null projectId");
    }

    const newComment = {
      projectId: projectId,
      cardId: cardId,
      by: username,
      uid: "", // Temporarily empty, will be filled with doc I
      text: text,
      lastUpdatedTime: "Now"
    };

    try {
      const commentDocRef = await addDoc(collection(db, "comments"), newComment);

      useMyStore.setState(produce((store) => {
        const cardToUpdate = store.cards.find((card) => card.uid === cardId);
        if (cardToUpdate) {
          newComment.uid = commentDocRef.id;
          cardToUpdate.comments.push(newComment);
        }
      }));

      await updateDoc(commentDocRef, { uid: commentDocRef.id, lastUpdatedTime: serverTimestamp() }); // Update the card with its UID

      await updateDoc(doc(db, "cards", cardId), {
        comments: arrayUnion(commentDocRef.id),
      });
    } catch (error) {
      console.error("Error adding/updating card:", error);
    }
  },

  addEvaluation: async (username, selectedCardIds, report) => {
    const { projectId } = useMyStore.getState();
    if (projectId == null) {
      throw new Error("null projectId");
    }

    const newEvaluation = {
      ...report,
      projectId: projectId,
      cardIds: [...selectedCardIds],
      by: username,
      uid: "", // Temporarily empty, will be filled with doc I
      lastUpdatedTime: "Now"
    };

    try {
      const evaluationDocRef = await addDoc(collection(db, "evaluations"), newEvaluation);

      useMyStore.setState(produce((store) => {
        const newEvaluations = store.evaluations;
        newEvaluations.push({ ...newEvaluation, uid: evaluationDocRef.id });
        store.evaluations = newEvaluations;
      }));

      await updateDoc(evaluationDocRef, { uid: evaluationDocRef.id, lastUpdatedTime: serverTimestamp() }); // Update the card with its UID

      await updateDoc(doc(db, "projects", projectId), {
        evaluations: arrayUnion(evaluationDocRef.id),
      });
    } catch (error) {
      console.error("Error adding/updating card:", error);
    }
  },

  addCardData: async (stage) => {
    const { projectId, cards } = useMyStore.getState();
    if (projectId == null) {
      throw new Error("null projectId");
    }

    const x = cards.reduce((max, card) => Math.max(card.position.x, max), 0) + 300;
    const y = cards.length > 0 ? cards.at(-1).position.y: 50;
    const newPosition = { x: x, y: y };



    const newCard = {
      projectId: projectId,
      uid: "", // Temporarily empty, will be filled with doc ID
      stage: stage,
      prompt: prompts[stage] || "No prompt available",
      description: "",
      comments: [],
      position: newPosition,
    };

    try {
      const cardDocRef = await addDoc(collection(db, "cards"), newCard);

      set(produce((store) => {
        newCard.uid = cardDocRef.id;
        store.cards.push(newCard);
      }));

      await updateDoc(cardDocRef, { uid: cardDocRef.id, createdAt: serverTimestamp() }); // Update the card with its UID

      await updateDoc(doc(db, "projects", projectId), {
        cards: arrayUnion(cardDocRef.id),
        lastUpdatedTime: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error adding/updating card:", error);
    }
  },

  setCardDescription: async (id, newDescription) => {
    set((state) => ({
      ...state,
      cards: state.cards.map((card) =>
        card.uid === id ? { ...card, description: newDescription } : card
      ),
    }));
    const cardDocRef = doc(db, "cards", id);
    try {
      await updateDoc(cardDocRef, { description: newDescription });
    } catch (error) {
      console.error("Error updating card description: ", error);
    }
  },
  setCardPosition: async (id, position) => {
    const { isRescaled, canvasScale, projectId } = useMyStore.getState(); // Move this outside the async operation
    
    set((state) => ({
      ...state,
      cards: state.cards.map((card) =>
        card.uid === id ? { ...card, position: position } : card
      ),
    }));
    
    const cardDocRef = doc(db, "cards", id);
    try {
      await updateDoc(cardDocRef, { position: position });
      
      if (isRescaled) {
        const projectDocRef = doc(db, "projects", projectId);
        await updateDoc(projectDocRef, { canvasScale: canvasScale });
        
        set(({isRescaled: false}));
      }
    } catch (error) {
      console.error("Error updating card position: ", error);
    }
  },

  setProjectName: async (projectName) => {
    const { projectId } = useMyStore.getState();

    if (projectId) {
      try {
        set((state) => ({
          ...state,
          projectName: projectName
        }));
        const projectDocRef = doc(db, "projects", projectId);
        await updateDoc(projectDocRef, { name: projectName });
      } catch (error) {
        console.error("Error updating name in Firestore:", error);
      }
    } else {
      console.error("projectId is not set");
    }
  },

  // Refs is {start: cardId, end: cardId} (must be dict)
  addLink: async (refs) => {
    if (refs.start === refs.end)
      return;

    let exist = false;
    set(
      produce((store) => {
        if (!store.links.some(link => (link.start === refs.start && link.end === refs.end))) {
          store.links.push(refs);
          exist = true;
      }
      })
    );
    
    if (exist) return; // Prevent duplicates

    const { projectId } = useMyStore.getState();

    if (projectId) {
      try {
        const projectDocRef = doc(db, "projects", projectId);
        const projectDocSnap = await getDoc(projectDocRef);
        const currentLinks = projectDocSnap.data().links || [];
        const updatedLinks = [...currentLinks, refs];
        await updateDoc(projectDocRef, { links: updatedLinks });
      } catch (error) {
        console.error("Error updating arrows in Firestore:", error);
      }
    } else {
      console.error("projectId is not set, unable to update arrows in Firestore");
    }
  },


  refreshLinks: () =>
    set(
      produce((store) => {
        store.links = [...store.links];
      })
    ),
  // TODO connect to firebase
  // addTemplate: (type) =>
  //   set(
  //     produce((store) => {
  //       if (cardsDatatemplates[type]) {
  //         const updatedCardsData = cardsDatatemplates[type].cardsData.map(
  //           (card) => {
  //             const stageName = card.id.split("-")[0]; // Extract stage name from the id
  //             return {
  //               ...card,
  //               prompt: prompts[stageName] || "No prompt available", // Assign the corresponding prompt
  //             };
  //           }
  //         );

  //         store.cardsData = updatedCardsData;
  //         store.arrows = cardsDatatemplates[type].arrows;
  //       } else {
  //         store.cardsData = [];
  //         store.arrows = [];
  //       }
  //     })
  //   ),

  resetStore: async () => {
    // Delete corresponding firestore data
    const { projectId, cards } = useMyStore.getState();
    if (projectId) {
      try {
        const projectDocRef = await getDoc(doc(db, "projects", projectId));
        await updateDoc(projectDocRef, { links: [], cards: [] });
      } catch (error) {
        console.error("Error updating arrows in Firestore:", error);
      }

      const cardFetchPromises = cards.forEach(cardId => {
        deleteDoc(doc(db, "cards", cardId));
      });
      await Promise.all(cardFetchPromises);

      set({
        cards: [],
        links: [],
        evaluations: [],
        projectName: "",
        projectId: "",
        canvasScale: { x: 1.1, y: 1.1 },
        isRescaled: false,
      });
    }
  },

  cleanStore: async (newProjectId) => {
    // Delete corresponding firestore data
    const { projectId } = useMyStore.getState();
    if (!projectId || projectId === newProjectId)
      return;
    set({
      cards: [],
      links: [],
      evaluations: [],
      projectName: "",
      projectId: "",
      canvasScale: { x: 1.1, y: 1.1 },
      isRescaled: false,
    });
  },

  deleteCardAndLinks: async (cardId) => {
    const { projectId, cards, links } = useMyStore.getState();
    const cardToDelete = cards.find((card) => card.uid === cardId);
    if (cardToDelete && cardToDelete.uid) {
      const cardToDeleteId = cardToDelete.uid;
      const newCardsData = cards.filter((card) => card.uid !== cardId);
      const newLinks = links.filter((link) => link.start !== cardId && link.end !== cardId);
      try {
        useMyStore.setState({ projectId: projectId, cards: newCardsData, links: newLinks });
        await deleteDoc(doc(db, "cards", cardToDeleteId));
        await updateDoc(doc(db, "projects", projectId), {
          cards: newCardsData.map((card) => card.uid),
          links: newLinks
        });
      } catch (error) {
        console.error("Error deleting card and links: ", error);
      }
    }
  },
  deleteComment: async (commentId) => {
    const { cards } = useMyStore.getState();

    useMyStore.setState((state) => {
      const newCards = state.cards.map((card) => {
        if (card.comments.some((comment) => comment.uid === commentId)) {
          const updatedComments = card.comments.filter((comment) => comment.uid !== commentId);
          return { ...card, comments: updatedComments };
        }
        return card;
      });

      return { ...state, cards: newCards };
    });

    try {
      const cardToUpdate = cards.find((card) => card.comments.some((comment) => comment.uid === commentId));
      if (cardToUpdate) {
        await updateDoc(doc(db, "cards", cardToUpdate.uid), {
          comments: cardToUpdate.comments.map((comment) => (comment.uid)).filter((uid) => uid !== commentId)
        });
        await deleteDoc(doc(db, "comments", commentId));
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
    }
  }
});

const useMyStore = createWithEqualityFn(devtools(myStore));

export default useMyStore;
