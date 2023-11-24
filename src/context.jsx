import { produce } from "immer";
import { create } from "zustand";
import { devtools, persist, createJSONStorage } from "zustand/middleware";

const cardsDatatemplates = {
    '8-stage': {
        cardsData: [
            { id: 'problem-0', descr: '', details: {}, position: { x: 100, y: 0 } },
            { id: 'task-0', descr: '', details: {}, position: { x: 200, y: 0 } },
            { id: 'data-0', descr: '', details: {}, position: { x: 300, y: 0 } },
            { id: 'model-0', descr: '', details: {}, position: { x: 400, y: 0 } },
            { id: 'train-0', descr: '', details: {}, position: { x: 500, y: 0 } },
            { id: 'test-0', descr: '', details: {}, position: { x: 600, y: 0 } },
            { id: 'deploy-0', descr: '', details: {}, position: { x: 700, y: 0 } },
            { id: 'feedback-0', descr: '', details: {}, position: { x: 800, y: 0 } },
        ],
        arrows: [
            {start: 'problem-0', end: 'task-0'},
            {start: 'task-0', end: 'data-0'},
            {start: 'data-0', end: 'model-0'},
            {start: 'model-0', end: 'train-0'},
            {start: 'train-0', end: 'test-0'},
            {start: 'test-0', end: 'deploy-0'},
            {start: 'deploy-0', end: 'feedback-0'},
        ]
    },
    '6-stage': {
        cardsData: [
            { id: 'problemDef-0', descr: '', details: {}, position: { x: 100, y: 0 } },
            { id: 'data-0', descr: '', details: {}, position: { x: 200, y: 0 } },
            { id: 'modelDevelopment-0', descr: '', details: {}, position: { x: 300, y: 0 } },
            { id: 'modelEvaluation-0', descr: '', details: {}, position: { x: 400, y: 0 } },
            { id: 'deployment-0', descr: '', details: {}, position: { x: 500, y: 0 } },
            { id: 'MLOps-0', descr: '', details: {}, position: { x: 600, y: 0 } },
        ],
        arrows: [
            {start: 'problemDef-0', end: 'data-0'},
            {start: 'data-0', end: 'modelDevelopment-0'},
            {start: 'modelDevelopment-0', end: 'modelEvaluation-0'},
            {start: 'modelEvaluation-0', end: 'deployment-0'},
            {start: 'deployment-0', end: 'MLOps-0'},
        ]
    },
    '3-stage': {
        cardsData: [
            { id: 'design-0', descr: '', details: {}, position: { x: 100, y: 0 } },
            { id: 'develop-0', descr: '', details: {}, position: { x: 200, y: 0 } },
            { id: 'deploy-0', descr: '', details: {}, position: { x: 300, y: 0 } },
        ],
        arrows: [
            {start: 'design-0', end: 'develop-0'},
            {start: 'develop-0', end: 'deploy-0'},
        ]
    },
};

const myStore = (set) => ({
    cardsData: [
        // { id: 'problem-0', descr: 'Problem Formulation', details: {}, position: { x: 0, y: 0 } },
        // { id: 'task-0', descr: 'Task Definition', details: {}, position: { x: 0, y: 0 } },
        // { id: 'data-0', descr: 'Dataset Construction', details: {}, position: { x: 0, y: 0 } },
        // { id: 'model-0', descr: 'Model Definition', details: {}, position: { x: 0, y: 0 } },
        // { id: 'train-0', descr: 'Training Process', details: {}, position: { x: 0, y: 0 } },
        // { id: 'test-0', descr: 'Testing Process', details: {}, position: { x: 0, y: 0 } },
        // { id: 'deploy-0', descr: 'Deployment', details: {}, position: { x: 0, y: 0 } },
        // { id: 'feedback-0', descr: 'Feedback', details: {}, position: { x: 0, y: 0 } },
    ],
    arrows: [],
    uuid: 0,
    addCardData: (stage) => set(
        produce(store => {
            store.uuid += 1;
            store.cardsData.push({ id: stage+'-'+store.uuid, descr: '', details: {}, position: { x: 0, y: 0 } });
        }
        ),
        false,
        "addCardData"
    ),
    setCardPosition: (id, position) => set(
        produce(store => {
            store.cardsData.map(cardData => {
                if (cardData.id == id)
                    cardData.position = position;
            });
        })
    ),
    addArrow: (refs) => set(
        produce(store => {
            store.arrows.push(refs);
        })
    ),
    refreshArrows: () => set(
        produce(store => {
            store.arrows = [...store.arrows];
        })
    ),
    addTemplate: (type) => set(
        produce(store => {
            if (cardsDatatemplates[type]){
                store.cardsData = cardsDatatemplates[type].cardsData;
                store.arrows = cardsDatatemplates[type].arrows;
            } else {
                store.cardsData = [];
                store.arrows = [];
            }
        })
    )
    // const newCardData = JSON.parse(JSON.stringify(state.cardDataTemplate));
    // newCardData.id = stage + "-" + state.stagesData[stage].nextCount;

    // // const newCardsData = [...state.cardsData, newCardData];
    // // const newLive = [...state.stagesData[stage].live, state.stagesData[stage].nextCount];
    // // const newNextCount = state.stagesData[stage].nextCount + 1;
    // return {
    //     cardsData: [...state.cardsData],
    // };
    // deleteCard: (id) => set((state) => {
    //     // let newCardsData = state.cardsData.filter(cardData => (cardData.id != id));
    //     const [stage, count] = id.split('-');
    //     let newLive = state.stagesData[stage].live.filter(idx => (idx !== count));
    //     let newDeleted = [state.stagesData[stage].newDeleted, count];
    //     return {
    //         cardsData: state.cardsData,
    //         stagesData: {
    //             ...state.stagesData,
    //             stage: {
    //                 ...state.stagesData[stage],
    //                 live: newLive,
    //                 deleted: newDeleted,
    //             }
    //         }
    //     }
    // })
});

const useMyStore = create(
    // persist(
    devtools(myStore),
    // {name: "myStore"}
    // )
);

export default useMyStore;