jest.mock("../firebase", () => ({ db: {} }));
jest.mock("firebase/firestore", () => ({ doc: jest.fn((db, kind, id) => ({ id: id || "new-id", kind })), collection: jest.fn(), onSnapshot: jest.fn(), arrayUnion: jest.fn(value => value), arrayRemove: jest.fn(value => value), serverTimestamp: jest.fn(), writeBatch: jest.fn(), updateDoc: jest.fn(), runTransaction: jest.fn() }));
import useMyStore from "./projectContext";
import { DEMO_STORAGE_KEY } from "../demo/scenario";
import { doc, updateDoc, onSnapshot, writeBatch, arrayUnion } from "firebase/firestore";
beforeEach(() => { doc.mockImplementation((db, kind, id) => ({ id: id || "new-id", kind })); arrayUnion.mockImplementation(value => value); localStorage.clear(); useMyStore.getState().openProject("", true); jest.clearAllMocks(); });
it("restores demo edits, stable personas and linked concerns without cloud writes", async () => {
  await useMyStore.getState().setCardDescription("demo-data", "Revised collection plan");
  await useMyStore.getState().addPersona({ uid: "custom", description: "An affected applicant" });
  await useMyStore.getState().addEvaluation("Visitor", ["demo-data"], { uid: "test-evaluation", type: "stage", problem: "Past hiring decisions encode bias" });
  useMyStore.getState().openProject("", true);
  expect(useMyStore.getState().cards.find(card => card.uid === "demo-data").description).toBe("Revised collection plan");
  expect(useMyStore.getState().personas).toHaveLength(1);
  expect(useMyStore.getState().evaluations[0].cardIds).toEqual(["demo-data"]);
  expect(updateDoc).not.toHaveBeenCalled(); expect(writeBatch).not.toHaveBeenCalled(); expect(onSnapshot).not.toHaveBeenCalled();
});
it("resets only the visitor's demo and handles corrupted browser data", async () => {
  await useMyStore.getState().deleteCardAndLinks("demo-data");
  await useMyStore.getState().resetDemo();
  expect(useMyStore.getState().cards).toHaveLength(8); expect(useMyStore.getState().links).toHaveLength(7);
  localStorage.setItem(DEMO_STORAGE_KEY, "corrupt"); useMyStore.getState().openProject("", true);
  expect(useMyStore.getState().cards).toHaveLength(8);
});
it("retains edits and permits retry after browser storage fails", async () => {
  const write = jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("Full"); });
  expect(await useMyStore.getState().setCardDescription("demo-data", "Retained draft")).toBe(false);
  expect(useMyStore.getState().saveStatus).toBe("error"); expect(useMyStore.getState().cards.find(card => card.uid === "demo-data").description).toBe("Retained draft");
  write.mockRestore(); await useMyStore.getState().retrySaves();
  expect(useMyStore.getState().saveStatus).toBe("saved"); expect(JSON.parse(localStorage.getItem(DEMO_STORAGE_KEY)).cards.find(card => card.uid === "demo-data").description).toBe("Retained draft");
});
it("rejects dangling links and removes only a deleted stage's connections", async () => {
  await useMyStore.getState().addLink({ start: "missing", end: "demo-data" }); expect(useMyStore.getState().links).toHaveLength(7);
  await useMyStore.getState().deleteCardAndLinks("demo-data"); expect(useMyStore.getState().links.every(link => link.start !== "demo-data" && link.end !== "demo-data")).toBe(true);
  expect(useMyStore.getState().cards).toHaveLength(7);
});
it("subscribes to projects and their cards, ignores missing documents and disposes all listeners", () => {
  const subscriptions = new Map();
  onSnapshot.mockImplementation((ref, callback) => { const stop = jest.fn(); subscriptions.set(`${ref.kind}/${ref.id}`, { callback, stop }); return stop; });
  const stop = useMyStore.getState().openProject("shared-project");
  subscriptions.get("projects/shared-project").callback({ exists: () => true, data: () => ({ name: "Shared", cards: ["card-a", "missing"], evaluations: ["evaluation-a"], links: [], personas: [{ uid: "person-a", description: "Applicant" }] }) });
  subscriptions.get("cards/card-a").callback({ exists: () => true, data: () => ({ stage: "data", description: "First draft", position: { x: 0, y: 0 }, comments: [] }) });
  subscriptions.get("cards/missing").callback({ exists: () => false });
  expect(useMyStore.getState().cards).toHaveLength(1);
  subscriptions.get("cards/card-a").callback({ exists: () => true, data: () => ({ stage: "data", description: "Collaborator edit", comments: [] }) });
  expect(useMyStore.getState().cards[0].description).toBe("Collaborator edit");
  stop(); subscriptions.forEach(subscription => expect(subscription.stop).toHaveBeenCalled());
});
it("keeps newer edits when an older queued write fails", async () => {
  onSnapshot.mockImplementation(() => jest.fn());
  useMyStore.getState().openProject("shared-project");
  useMyStore.setState({ cards: [{ uid: "card-a", description: "", position: { x: 0, y: 0 }, comments: [] }] });
  updateDoc.mockRejectedValueOnce(new Error("Old write failed")).mockResolvedValueOnce();
  const first = useMyStore.getState().setCardDescription("card-a", "Old edit");
  const second = useMyStore.getState().setCardDescription("card-a", "New edit");
  await Promise.all([first, second]);
  expect(useMyStore.getState().cards[0].description).toBe("New edit");
  expect(useMyStore.getState().saveStatus).toBe("saved");
  expect(updateDoc.mock.calls.map(call => call[1].description)).toEqual(["Old edit", "New edit"]);
});

it("recovers a failed signed-in persona save on reload and retries without duplicating it", async () => {
  let receiveProject;
  onSnapshot.mockImplementation((ref, callback) => { receiveProject = callback; return jest.fn(); });
  const project = personas => ({ exists: () => true, data: () => ({ cards: [], evaluations: [], personas }) });
  const persona = { uid: "refresh-persona", description: "An affected applicant", imgUrl: "lego.png" };
  useMyStore.getState().openProject("signed-in-project");
  receiveProject(project([]));
  updateDoc.mockRejectedValueOnce(new Error("Offline"));
  expect(await useMyStore.getState().addPersona(persona)).toBe(false);
  // An unrelated project snapshot must not erase the unsaved persona.
  receiveProject(project([]));
  expect(useMyStore.getState().personas).toEqual([persona]);
  updateDoc.mockResolvedValue();
  useMyStore.getState().openProject("signed-in-project");
  expect(useMyStore.getState().personas).toEqual([persona]);
  receiveProject(project([]));
  await new Promise(resolve => setTimeout(resolve, 0));
  expect(updateDoc).toHaveBeenLastCalledWith({ kind: "projects", id: "signed-in-project" }, expect.objectContaining({ personas: persona }));
  expect(localStorage.getItem("ai-lego-pending-personas-signed-in-project")).toBeNull();
  receiveProject(project([persona]));
  useMyStore.getState().openProject("signed-in-project");
  receiveProject(project([persona]));
  expect(useMyStore.getState().personas).toEqual([persona]);
  expect(updateDoc).toHaveBeenCalledTimes(2);
});

it("does not restore another project's pending personas", async () => {
  onSnapshot.mockImplementation(() => jest.fn());
  useMyStore.getState().openProject("first-project");
  updateDoc.mockRejectedValueOnce(new Error("Offline"));
  await useMyStore.getState().addPersona({ uid: "private-persona", description: "First project only" });
  useMyStore.getState().openProject("second-project");
  expect(useMyStore.getState().personas).toEqual([]);
});

it("keeps a signed-in persona through refresh before its cloud write completes", async () => {
  let receiveProject;
  onSnapshot.mockImplementation((ref, callback) => { receiveProject = callback; return jest.fn(); });
  const snapshot = { exists: () => true, data: () => ({ cards: [], evaluations: [], personas: [] }) };
  const persona = { uid: "in-flight-persona", description: "An applicant" };
  let acknowledge;
  let notifyStarted;
  const started = new Promise(resolve => { notifyStarted = resolve; });
  updateDoc.mockImplementationOnce(() => new Promise(resolve => { acknowledge = resolve; notifyStarted(); })).mockResolvedValue();
  useMyStore.getState().openProject("signed-in-project");
  receiveProject(snapshot);
  const saving = useMyStore.getState().addPersona(persona);
  await started;
  useMyStore.getState().openProject("signed-in-project");
  receiveProject(snapshot);
  expect(useMyStore.getState().personas).toEqual([persona]);
  acknowledge();
  await saving;
  await new Promise(resolve => setTimeout(resolve, 0));
  expect(useMyStore.getState().personas).toEqual([persona]);
  expect(useMyStore.getState().saveStatus).toBe("saved");
});
