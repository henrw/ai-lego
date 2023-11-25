import { produce } from "immer";
import { create } from "zustand";
import { devtools } from "zustand/middleware";

const canvasStore = (set) => ({
    selectedCardId: null,
    actions: {
        selectCardId: (id) => set(
            produce(store => {
                store.selectedCardId = id;
            })
        ),
        unselectCard: () => set(
            produce(store => {
                store.selectedCardId = null;
            })
        )
    }
});

const useCanvasStore = create(devtools(canvasStore));

export default useCanvasStore;