import { v4 as uuid } from "uuid";
import { createWithEqualityFn } from "zustand/traditional";
import { db } from "../firebase";
import { doc, collection, onSnapshot, arrayUnion, arrayRemove, serverTimestamp, writeBatch, updateDoc, runTransaction } from "firebase/firestore";
import { createDemoProject, DEMO_STORAGE_KEY } from "../demo/scenario";

export const prompts = {
  problem:
    "Clearly identify the problem or challenge that your intended AI solution is expected to address.",
  task: "Detail the specific task(s) that your intended AI solution is designed to perform to solve the previously identified problem.",
  data: "Describe where and how the data for training your intended AI solution is collected and prepared,  explain the data preprocessing steps and any feature engineering technologies that are applied to the raw data.\n\nIf the intended AI solution is a generative AI, describe the fine tuning dataset you’re using. ",
  model:
    "Describe the AI model architecture, the proxies selected and algorithms used, explaining their roles and functionalities.\n\nIf the intended AI solution is a generative AI, describe the base model you’re using, the prompting techniques and the fine tuning methods. ",
  train:
    "Describe how the AI solution is trained using the curated data, and clarify the process of how it improves its performance.",
  test: "Explain how the AI solution is evaluated and highlight the key performance metrics used to assess the AI.",
  deploy:
    "Describe how the AI solution is implemented and integrated into practical use environments.",
  feedback:
    "Outline how feedback is collected, specifying who the feedback is gathered from and how often the feedback is collected.",
};

export const colorClasses = {
  problem: "problem",
  task: "task",
  data: "data",
  model: "model",
  train: "train",
  test: "test",
  deploy: "deploy",
  feedback: "feedback",
  design: "design",
  develop: "develop",
  modelEvaluation: "modelEva",
  modelDevelopment: "modelDev",
  MLOps: "MLOps",
  problemDef: "problemDef",
  "➕": "➕",
};

export const stageEvaluationPrompts = {
  problem: "Is the problem or challenge itself ethical? Can the intended AI solution provide a viable solution to the identified problem?",
  task: "What are the boundaries and limitations of what the AI solution is expected to achieve?",
  data: "Are there any potential biases, privacy concerns and other ethical considerations in data handling?",
  model: "Is the choice of models, proxies, and algorithms appropriate for the task identified?\n\nIf the intended AI solution is a generative AI, is the choice of the base model, the prompting techniques and the fine tuning methods appropriate for the task identified?",
  train: "Can you think of ways the training process might go wrong? If so, how?",
  test: "What would it mean for the AI to be successful? Are the performance metrics sufficient for evaluating the success of AI?",
  deploy: "Does the deployment of the AI fit with the real-world practical use environments?",
  feedback: "Is the feedback being collected from the relevant groups of impacted stakeholders, at the right intervals, and using effective methods?",
};

const emptyProject = { projectName: "", projectId: "", cards: [], links: [], evaluations: [], personas: [], canvasScale: { x: 1.1, y: 1.1 }, isRescaled: false };
let disposeProject = () => {};
let generation = 0;
const failedWrites = new Map();
const pendingWrites = new Set();
const draftDescriptions = new Map();
const writeVersions = new Map();
const writeQueues = new Map();
const pendingPersonas = new Map();
const personaRecoveryKey = projectId => `ai-lego-pending-personas-${projectId}`;
function readPendingPersonas(projectId) {
  try {
    const values = JSON.parse(localStorage.getItem(personaRecoveryKey(projectId)) || "[]");
    return Array.isArray(values) ? values.filter(value => value.uid && typeof value.description === "string") : [];
  } catch { return []; }
}
function cachePersona(projectId, value) {
  localStorage.setItem(personaRecoveryKey(projectId), JSON.stringify(replaceById(readPendingPersonas(projectId), value)));
}
async function savePersona(ref, projectId, value, epoch) {
  await updateDoc(ref, { personas: arrayUnion(value), lastUpdatedTime: serverTimestamp() });
  // Only a successful server write can discard the refresh recovery copy.
  try {
    const remaining = readPendingPersonas(projectId).filter(item => item.uid !== value.uid || JSON.stringify(item) !== JSON.stringify(value));
    if (remaining.length) localStorage.setItem(personaRecoveryKey(projectId), JSON.stringify(remaining));
    else localStorage.removeItem(personaRecoveryKey(projectId));
  } catch { /* Retrying an acknowledged arrayUnion is safe. */ }
  if (epoch === generation && pendingPersonas.get(value.uid) === value) pendingPersonas.delete(value.uid);
}

function reportSaveState() {
  useMyStore.setState({ saveStatus: failedWrites.size ? "error" : pendingWrites.size ? "saving" : "saved", saveError: failedWrites.size ? "Some changes could not be saved. Your draft is still here. Retry saving." : "" });
}
// Each retry keeps the original operation and document ID. Newer edits replace older retries.
async function persist(key, action) {
  const epoch = generation;
  const version = (writeVersions.get(key) || 0) + 1;
  writeVersions.set(key, version);
  const ticket = {};
  pendingWrites.add(ticket);
  failedWrites.delete(key);
  reportSaveState();
  try {
    if (useMyStore.getState().isDemo) {
      const { projectName, projectId, cards, links, evaluations, personas, canvasScale } = useMyStore.getState();
      localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify({ projectName, projectId, cards, links, evaluations, personas, canvasScale }));
    } else {
      const previous = writeQueues.get(key) || Promise.resolve();
      const task = previous.catch(() => {}).then(action);
      writeQueues.set(key, task);
      await task;
      if (writeQueues.get(key) === task) writeQueues.delete(key);
    }
    return true;
  } catch (error) {
    if (epoch === generation && writeVersions.get(key) === version) failedWrites.set(key, () => persist(key, action));
    return false;
  } finally {
    if (epoch === generation) { pendingWrites.delete(ticket); reportSaveState(); }
  }
}
function projectRef() {
  const { projectId } = useMyStore.getState();
  if (!projectId) throw new Error("Open a project before editing.");
  return doc(db, "projects", projectId);
}
function newId(kind) { return useMyStore.getState().isDemo ? `${kind}-${uuid()}` : doc(collection(db, kind)).id; }
function now() { return useMyStore.getState().isDemo ? new Date().toISOString() : serverTimestamp(); }
function replaceById(items, item) { return items.some(old => old.uid === item.uid) ? items.map(old => old.uid === item.uid ? item : old) : [...items, item]; }

const useMyStore = createWithEqualityFn((set, get) => ({
  ...emptyProject, isDemo: false, loadingProject: false, loadError: "", saveStatus: "saved", saveError: "",
  retrySaves: async () => { await Promise.all([...failedWrites.values()].map(retry => retry())); },
  openProject: (projectId, isDemo = false) => {
    disposeProject(); generation += 1; pendingWrites.clear(); failedWrites.clear(); draftDescriptions.clear(); writeVersions.clear(); writeQueues.clear(); pendingPersonas.clear();
    set({ ...emptyProject, projectId: projectId || "", isDemo, loadingProject: true, loadError: "", saveStatus: "saved", saveError: "" });
    const epoch = generation;
    if (isDemo) {
      let data = createDemoProject();
      try {
        const saved = JSON.parse(localStorage.getItem(DEMO_STORAGE_KEY));
        if (saved && saved.projectId === "demo" && Array.isArray(saved.cards) && saved.cards.every(card => card.uid && card.position && card.stage) && Array.isArray(saved.links) && Array.isArray(saved.personas) && Array.isArray(saved.evaluations)) data = saved;
      } catch { /* A corrupt demo can always be reopened from the curated scenario. */ }
      set({ ...data, loadingProject: false });
      disposeProject = () => {};
      return disposeProject;
    }
    if (!projectId) { set({ loadingProject: false, loadError: "Choose a project from your home page." }); return () => {}; }
    const recoveredPersonas = readPendingPersonas(projectId);
    recoveredPersonas.forEach(persona => pendingPersonas.set(persona.uid, persona));
    set({ personas: recoveredPersonas });
    let resumedPersonaSaves = false;
    const watchers = new Map();
    const received = { cards: new Set(), evaluations: new Set() };
    let expected = { cards: [], evaluations: [] };
    const updateLoading = () => { if (epoch === generation) set({ loadingProject: Object.keys(expected).some(kind => expected[kind].some(id => !received[kind].has(id))) }); };
    let projectUnsubscribe;
    const fail = () => { if (epoch === generation) set({ loadingProject: false, loadError: "Could not load this project. Check your connection and project access, then retry." }); };
    const watch = (kind, ids) => {
      const field = kind === "cards" ? "cards" : "evaluations";
      const wanted = new Set(ids);
      for (const [key, unsubscribe] of watchers) {
        if (key.startsWith(kind + "/") && !wanted.has(key.slice(kind.length + 1))) { unsubscribe(); watchers.delete(key); received[kind].delete(key.slice(kind.length + 1));
          if (kind === "cards") for (const [commentKey, stop] of watchers) { if (commentKey.startsWith(`comments/${key.slice(kind.length + 1)}/`)) { stop(); watchers.delete(commentKey); } }
        }
      }
      set(state => ({ [field]: state[field].filter(item => wanted.has(item.uid)) }));
      ids.forEach(id => {
        const key = `${kind}/${id}`;
        if (watchers.has(key)) return;
        watchers.set(key, onSnapshot(doc(db, kind, id), snapshot => {
          if (epoch !== generation || !expected[kind].includes(id)) return;
          received[kind].add(id);
          if (!snapshot.exists()) { set(state => ({ [field]: state[field].filter(item => item.uid !== id) })); updateLoading(); return; }
          const item = { ...snapshot.data(), uid: id };
          if (kind === "cards") {
            item.position = item.position || { x: 180, y: 50 };
            item.comments = get().cards.find(card => card.uid === id)?.comments || [];
            if (draftDescriptions.has(id)) item.description = draftDescriptions.get(id);
            const commentIds = snapshot.data().comments || [];
            const prefix = `comments/${id}/`;
            for (const [commentKey, unsubscribe] of watchers) {
              if (commentKey.startsWith(prefix) && !commentIds.includes(commentKey.slice(prefix.length))) { unsubscribe(); watchers.delete(commentKey); }
            }
            item.comments = item.comments.filter(comment => commentIds.includes(comment.uid));
            set(state => ({ cards: replaceById(state.cards, item) }));
            commentIds.forEach(commentId => {
              const commentKey = prefix + commentId;
              if (watchers.has(commentKey)) return;
              watchers.set(commentKey, onSnapshot(doc(db, "comments", commentId), commentSnap => {
                if (epoch !== generation) return;
                set(state => ({ cards: state.cards.map(card => card.uid === id ? { ...card, comments: commentSnap.exists() ? replaceById(card.comments, { ...commentSnap.data(), uid: commentId }) : card.comments.filter(comment => comment.uid !== commentId) } : card) }));
              }, fail));
            });
          } else set(state => ({ evaluations: replaceById(state.evaluations, item) }));
          updateLoading();
        }, fail));
      });
    };
    projectUnsubscribe = onSnapshot(doc(db, "projects", projectId), snapshot => {
      if (epoch !== generation) return;
      if (!snapshot.exists()) { set({ loadingProject: false, loadError: "This project no longer exists. Return home or try the demo." }); return; }
      const data = snapshot.data();
      const savedPersonas = (data.personas || []).map((persona, index) => ({ ...persona, uid: persona.uid || `legacy-persona-${index}` }));
      const personas = [...pendingPersonas.values()].reduce(replaceById, savedPersonas);
      set({ projectName: data.name || "Untitled project", links: data.links || [], personas, canvasScale: data.canvasScale || emptyProject.canvasScale, loadingProject: false, loadError: "" });
      if (!resumedPersonaSaves) {
        resumedPersonaSaves = true;
        recoveredPersonas.forEach(value => persist(`persona-${value.uid}`, () => savePersona(doc(db, "projects", projectId), projectId, value, epoch)));
      }
      expected = { cards: data.cards || [], evaluations: data.evaluations || [] };
      watch("cards", expected.cards); watch("evaluations", expected.evaluations); updateLoading();
    }, fail);
    disposeProject = () => { projectUnsubscribe(); watchers.forEach(unsubscribe => unsubscribe()); watchers.clear(); };
    return disposeProject;
  },
  resetDemo: async () => {
    generation += 1; pendingWrites.clear(); failedWrites.clear(); draftDescriptions.clear(); writeVersions.clear(); writeQueues.clear();
    set({ ...createDemoProject(), saveStatus: "saved", saveError: "" }); return persist("demo-reset", () => {});
  },
  extendCanvasRight: () => set(state => ({ canvasScale: { ...state.canvasScale, x: Math.max(1.1, document.documentElement.scrollWidth / window.innerWidth) }, isRescaled: true })),
  extendCanvasBottom: () => set(state => ({ canvasScale: { ...state.canvasScale, y: Math.max(1.1, document.documentElement.scrollHeight / window.innerHeight) }, isRescaled: true })),
  addCardData: async stage => {
    const { cards, projectId } = get();
    const card = { uid: newId("cards"), projectId, stage, prompt: prompts[stage] || "Describe this stage.", description: "", comments: [], position: { x: cards.reduce((max, card) => Math.max(card.position.x, max), 0) + 300, y: cards.length ? cards.at(-1).position.y : 50 } };
    set({ cards: [...cards, card] });
    const ref = get().isDemo ? null : projectRef();
    return persist(`card-add-${card.uid}`, async () => { const batch = writeBatch(db); batch.set(doc(db, "cards", card.uid), { ...card, createdAt: serverTimestamp() }); batch.update(ref, { cards: arrayUnion(card.uid), lastUpdatedTime: serverTimestamp() }); await batch.commit(); });
  },
  setCardDescription: async (id, description) => {
    draftDescriptions.set(id, description);
    set(state => ({ cards: state.cards.map(card => card.uid === id ? { ...card, description } : card) }));
    const success = await persist(`description-${id}`, async () => {
      await updateDoc(doc(db, "cards", id), { description });
      if (draftDescriptions.get(id) === description) draftDescriptions.delete(id);
    });
    if (success && draftDescriptions.get(id) === description) draftDescriptions.delete(id);
    return success;
  },
  setCardPosition: async (id, position) => {
    set(state => ({ cards: state.cards.map(card => card.uid === id ? { ...card, position } : card) }));
    const ref = get().isDemo ? null : projectRef(); const scale = get().canvasScale;
    return persist(`position-${id}`, async () => { const batch = writeBatch(db); batch.update(doc(db, "cards", id), { position }); batch.update(ref, { canvasScale: scale, lastUpdatedTime: serverTimestamp() }); await batch.commit(); });
  },
  setProjectName: async projectName => { set({ projectName }); const ref = get().isDemo ? null : projectRef(); return persist("name", () => updateDoc(ref, { name: projectName, lastUpdatedTime: serverTimestamp() })); },
  addPersona: async persona => {
    const value = { ...persona, uid: persona.uid || newId("personas") }; set(state => ({ personas: replaceById(state.personas, value) }));
    const ref = get().isDemo ? null : projectRef();
    const projectId = get().projectId; const epoch = generation;
    if (!get().isDemo) {
      pendingPersonas.set(value.uid, value);
      try { cachePersona(projectId, value); } catch { /* Cloud saving still works if browser storage is unavailable. */ }
    }
    return persist(`persona-${value.uid}`, () => savePersona(ref, projectId, value, epoch));
  },
  addComment: async (username, cardId, text) => {
    const card = get().cards.find(item => item.uid === cardId);
    if (!card || !text.trim()) return false;
    const comment = { uid: newId("comments"), projectId: get().projectId, cardId, by: username || "Anonymous", text, lastUpdatedTime: now() };
    set(state => ({ cards: state.cards.map(item => item.uid === cardId ? { ...item, comments: replaceById(item.comments, comment) } : item) }));
    return persist(`comment-${comment.uid}`, async () => {
      const batch = writeBatch(db);
      batch.set(doc(db, "comments", comment.uid), comment);
      batch.update(doc(db, "cards", cardId), { comments: arrayUnion(comment.uid) });
      await batch.commit();
    });
  },
  addEvaluation: async (username, cardIds, report) => {
    if (!report.problem?.trim()) return false;
    const evaluation = { ...report, uid: report.uid || newId("evaluations"), projectId: get().projectId, cardIds: [...cardIds], by: username || "Anonymous", lastUpdatedTime: now() };
    const ref = get().isDemo ? null : projectRef();
    set(state => ({ evaluations: replaceById(state.evaluations, evaluation) }));
    return persist(`evaluation-${evaluation.uid}`, async () => { const batch = writeBatch(db); batch.set(doc(db, "evaluations", evaluation.uid), evaluation); batch.update(ref, { evaluations: arrayUnion(evaluation.uid), lastUpdatedTime: serverTimestamp() }); await batch.commit(); });
  },
  addLink: async link => {
    if (!link.start || link.start === link.end || !get().cards.some(card => card.uid === link.start) || !get().cards.some(card => card.uid === link.end) || get().links.some(old => old.start === link.start && old.end === link.end)) return;
    set(state => ({ links: [...state.links, link] })); const ref = get().isDemo ? null : projectRef();
    return persist(`connection-${link.start}-${link.end}`, () => runTransaction(db, async transaction => {
      const snapshot = await transaction.get(ref);
      const cardIds = snapshot.data()?.cards || [];
      if (!cardIds.includes(link.start) || !cardIds.includes(link.end)) throw new Error("A connected stage was deleted.");
      transaction.update(ref, { links: arrayUnion(link), lastUpdatedTime: serverTimestamp() });
    }));
  },
  removeLink: async link => { set(state => ({ links: state.links.filter(old => old.start !== link.start || old.end !== link.end) })); const ref = get().isDemo ? null : projectRef(); return persist(`connection-${link.start}-${link.end}`, () => updateDoc(ref, { links: arrayRemove(link), lastUpdatedTime: serverTimestamp() })); },
  refreshLinks: () => set(state => ({ links: [...state.links] })),
  deleteCardAndLinks: async id => {
    const card = get().cards.find(item => item.uid === id); if (!card) return;
    if (get().isDemo) {
      set(state => ({ cards: state.cards.filter(card => card.uid !== id), links: state.links.filter(link => link.start !== id && link.end !== id) }));
      return persist(`delete-${id}`, () => {});
    }
    const ref = projectRef();
    const success = await persist(`delete-${id}`, async () => {
      await runTransaction(db, async transaction => {
        const snapshot = await transaction.get(ref); const data = snapshot.data();
        transaction.update(ref, { cards: arrayRemove(id), links: (data.links || []).filter(link => link.start !== id && link.end !== id), lastUpdatedTime: serverTimestamp() });
        transaction.delete(doc(db, "cards", id));
        card.comments.forEach(comment => transaction.delete(doc(db, "comments", comment.uid)));
      });
    });
    if (success) { set(state => ({ cards: state.cards.filter(card => card.uid !== id), links: state.links.filter(link => link.start !== id && link.end !== id) })); if (get().isDemo) await persist(`delete-${id}`, () => {}); }
  },
  deleteComment: async id => {
    const card = get().cards.find(item => item.comments.some(comment => comment.uid === id)); if (!card) return;
    if (get().isDemo) {
      set(state => ({ cards: state.cards.map(item => item.uid === card.uid ? { ...item, comments: item.comments.filter(comment => comment.uid !== id) } : item) }));
      return persist(`comment-delete-${id}`, () => {});
    }
    const success = await persist(`comment-delete-${id}`, async () => { const batch = writeBatch(db); batch.update(doc(db, "cards", card.uid), { comments: arrayRemove(id) }); batch.delete(doc(db, "comments", id)); await batch.commit(); });
    if (success) { set(state => ({ cards: state.cards.map(item => item.uid === card.uid ? { ...item, comments: item.comments.filter(comment => comment.uid !== id) } : item) })); if (get().isDemo) await persist(`comment-delete-${id}`, () => {}); }
  },
  resetStore: async () => {
    if (get().isDemo) return get().resetDemo();
    // Reset only documents referenced by this project, atomically and without deleting its identity.
    const ref = projectRef();
    return persist("reset", async () => {
      await runTransaction(db, async transaction => {
        const snapshot = await transaction.get(ref); const data = snapshot.data();
        (data.cards || []).forEach(id => transaction.delete(doc(db, "cards", id)));
        (data.evaluations || []).forEach(id => transaction.delete(doc(db, "evaluations", id)));
        get().cards.forEach(card => card.comments.forEach(comment => transaction.delete(doc(db, "comments", comment.uid))));
        transaction.update(ref, { cards: [], links: [], evaluations: [], personas: [], lastUpdatedTime: serverTimestamp() });
      });
    });
  },
}));
export default useMyStore;
