jest.mock("../utils/accountAuthor", () => ({ accountAuthor: jest.fn(async name => ({ name: name || "Participant", occupation: "Admin", uid: "account" })) }));
jest.mock("../firebase", () => ({ db: {} }));
jest.mock("firebase/firestore", () => ({ doc: jest.fn((db, kind, id) => ({ id: id || "new-id", kind })), collection: jest.fn(), onSnapshot: jest.fn(), arrayUnion: jest.fn(value => value), arrayRemove: jest.fn(value => value), serverTimestamp: jest.fn(), writeBatch: jest.fn(), updateDoc: jest.fn(), runTransaction: jest.fn() }));
import { accountAuthor } from "../utils/accountAuthor";
import useMyStore from "./projectContext";
import { DEMO_STORAGE_KEY } from "../demo/scenario";
import { doc, updateDoc, onSnapshot, writeBatch, arrayUnion, runTransaction } from "firebase/firestore";
beforeEach(() => { accountAuthor.mockImplementation(async name => ({ name: name || "Participant", occupation: "Admin", uid: "account" })); doc.mockImplementation((db, kind, id) => ({ id: id || "new-id", kind })); arrayUnion.mockImplementation(value => value); localStorage.clear(); useMyStore.getState().openProject("", true); jest.clearAllMocks(); });
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

it("loads legacy demo notes and persists edits, including clearing them", async () => {
  const data = JSON.parse(JSON.stringify(useMyStore.getState()));
  delete data.notes;
  data.cards.push({ uid: "old-note", stage: "note", description: "Project background", position: { x: 50, y: 50 }, comments: [] });
  localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(data));
  useMyStore.getState().openProject("", true);
  expect(useMyStore.getState().notes).toBe("Project background");
  expect(await useMyStore.getState().addCardData("note")).toBe(false);
  await useMyStore.getState().setProjectNotes("Updated background");
  useMyStore.getState().openProject("", true);
  expect(useMyStore.getState().notes).toBe("Updated background");
  await useMyStore.getState().setProjectNotes("");
  useMyStore.getState().openProject("", true);
  expect(useMyStore.getState().notes).toBe("");
});

it("combines cloud Note blocks in project order, and respects an explicitly empty notes field", () => {
  const subscriptions = new Map();
  onSnapshot.mockImplementation((ref, callback) => { subscriptions.set(`${ref.kind}/${ref.id}`, callback); return jest.fn(); });
  useMyStore.getState().openProject("notes-project");
  const project = notes => ({ exists: () => true, data: () => ({ cards: ["note-a", "note-b"], evaluations: [], ...(notes === undefined ? {} : { notes }) }) });
  subscriptions.get("projects/notes-project")(project());
  subscriptions.get("cards/note-b")({ exists: () => true, data: () => ({ stage: "Note", description: "Second note", comments: [] }) });
  subscriptions.get("cards/note-a")({ exists: () => true, data: () => ({ stage: "note", description: "First note", comments: [] }) });
  expect(useMyStore.getState().notes).toBe("First note\n\nSecond note");
  subscriptions.get("projects/notes-project")(project(""));
  expect(useMyStore.getState().notes).toBe("");
});

it("retains a failed cloud notes edit across incoming snapshots and permits retry", async () => {
  let receive;
  onSnapshot.mockImplementation((ref, callback) => { receive = callback; return jest.fn(); });
  useMyStore.getState().openProject("notes-project");
  const snapshot = { exists: () => true, data: () => ({ cards: [], evaluations: [], notes: "Previous text" }) };
  receive(snapshot);
  updateDoc.mockRejectedValueOnce(new Error("Offline"));
  expect(await useMyStore.getState().setProjectNotes("Retained edit")).toBe(false);
  receive(snapshot);
  expect(useMyStore.getState().notes).toBe("Retained edit");
  updateDoc.mockResolvedValue();
  await useMyStore.getState().retrySaves();
  expect(updateDoc).toHaveBeenLastCalledWith({ kind: "projects", id: "notes-project" }, expect.objectContaining({ notes: "Retained edit" }));
  expect(useMyStore.getState().saveStatus).toBe("saved");
});

it('persists resolution proposals, review feedback and approval across demo refreshes', async () => {
 await useMyStore.getState().addEvaluation('PM',['demo-data'],{uid:'resolution-issue',type:'stage',problem:'Check biased labels'});
 const issue=useMyStore.getState().evaluations[0];
 expect(issue.specificationBaseline.find(card=>card.uid==='demo-data').description).toContain('historical resumes');
 await useMyStore.getState().setCardDescription('demo-data','Audit training labels for bias');
 expect(await useMyStore.getState().reviewIssue('evaluations','resolution-issue','submit',{uid:'proposal',summary:'Added an audit',cardIds:['demo-data']})).toEqual({ok:true});
 useMyStore.getState().openProject('',true);
 expect(useMyStore.getState().evaluations[0].resolutionStatus).toBe('pending');
 expect(await useMyStore.getState().reviewIssue('evaluations','resolution-issue','request_changes',{resolutionId:'proposal',note:'Add fairness tests'})).toEqual({ok:true});
 expect(useMyStore.getState().evaluations[0].resolutionStatus).toBe('open');
 expect(await useMyStore.getState().reviewIssue('evaluations','resolution-issue','submit',{uid:'proposal2',summary:'Updated audit plan',cardIds:['demo-data']})).toEqual({ok:true});
 expect(await useMyStore.getState().reviewIssue('evaluations','resolution-issue','approve',{resolutionId:'proposal2'})).toEqual({ok:true});
 useMyStore.getState().openProject('',true);
 expect(useMyStore.getState().evaluations[0].resolutionStatus).toBe('resolved');
 expect(useMyStore.getState().evaluations[0].resolutionHistory).toHaveLength(4);
});
it('supports comment resolutions as well as stage and persona evaluations',async()=>{
 await useMyStore.getState().addComment('UX','demo-data','Review privacy');
 const comment=useMyStore.getState().cards.find(card=>card.uid==='demo-data').comments[0];
 await useMyStore.getState().setCardDescription('demo-data','Minimize retained applicant data');
 expect(await useMyStore.getState().reviewIssue('comments',comment.uid,'submit',{uid:'proposal',summary:'Added data minimization',cardIds:['demo-data']})).toEqual({ok:true});
 expect(useMyStore.getState().cards.find(card=>card.uid==='demo-data').comments[0].resolutionStatus).toBe('pending');
});

it('checks persisted specifications and current proposal atomically before approving',async()=>{
 onSnapshot.mockImplementation(()=>jest.fn());
 useMyStore.getState().openProject('team');
 const issue={uid:'issue',projectId:'team',resolutionStatus:'pending',resolution:{uid:'proposal',changes:[{cardId:'data',stage:'data',after:'Audited labels'}]}};
 useMyStore.setState({evaluations:[issue],cards:[{uid:'data',projectId:'team',stage:'data',description:'Audited labels',comments:[]}]});
 accountAuthor.mockResolvedValue({uid:'ux',name:'Sam',occupation:'UI/UX Designer'});
 const write=jest.fn();
 let serverDescription='Changed by another account';
 runTransaction.mockImplementation(async(db,work)=>work({get:async ref=>({exists:()=>true,data:()=>ref.kind==='evaluations'?issue:{projectId:'team',stage:'data',description:serverDescription}}),update:write}));
 const stale=await useMyStore.getState().reviewIssue('evaluations','issue','approve',{resolutionId:'proposal'});
 expect(stale.ok).toBe(false);expect(stale.error).toContain('changed after');expect(write).not.toHaveBeenCalled();
 serverDescription='Audited labels';
 expect(await useMyStore.getState().reviewIssue('evaluations','issue','approve',{resolutionId:'proposal'})).toEqual({ok:true});
 expect(write).toHaveBeenCalledWith(expect.objectContaining({kind:'evaluations',id:'issue'}),expect.objectContaining({resolutionStatus:'resolved'}));
 expect(useMyStore.getState().evaluations[0].resolutionStatus).toBe('resolved');
});
it('rejects an AI account trying to approve its own proposal',async()=>{
 onSnapshot.mockImplementation(()=>jest.fn());useMyStore.getState().openProject('team');
 const issue={uid:'issue',projectId:'team',resolutionStatus:'pending',resolution:{uid:'proposal',changes:[{cardId:'data',stage:'data',after:'Audited labels'}]}};
 useMyStore.setState({evaluations:[issue]});
 accountAuthor.mockResolvedValue({uid:'ai',name:'Alex',occupation:'AI Developer'});
 const write=jest.fn();runTransaction.mockImplementation(async(db,work)=>work({get:async ref=>({exists:()=>true,data:()=>ref.kind==='evaluations'?issue:{projectId:'team',stage:'data',description:'Audited labels'}}),update:write}));
 expect((await useMyStore.getState().reviewIssue('evaluations','issue','approve',{resolutionId:'proposal'})).error).toContain('PM/UX');
 expect(write).not.toHaveBeenCalled();
});

it('saves a specification draft before submitting its inline resolution',async()=>{
 const store=useMyStore.getState();
 await store.addEvaluation('Sam',['demo-data'],{uid:'draft-issue',type:'stage',problem:'Check labels'});
 store.setCardDraft('demo-data','Independently audit the labels');
 expect(useMyStore.getState().cards.find(card=>card.uid==='demo-data').description).toBe('Independently audit the labels');
 const save=jest.spyOn(useMyStore.getState(),'setCardDescription');
 const result=await useMyStore.getState().reviewIssue('evaluations','draft-issue','submit',{uid:'draft-proposal',cardIds:['demo-data']});
 expect(result).toEqual({ok:true});
 expect(save).toHaveBeenCalledWith('demo-data','Independently audit the labels');
 expect(useMyStore.getState().evaluations.find(issue=>issue.uid==='draft-issue').resolution.changes[0].after).toBe('Independently audit the labels');
 save.mockRestore();
});

it('keeps the generation baseline when the plan changes before a scenario is saved', async () => {
 const baseline=[{uid:'demo-data',stage:'data',description:'Original labels'}];
 await useMyStore.getState().addEvaluation('Visitor',['demo-data'],{uid:'scenario-run',type:'persona',problem:'Potential exclusion',workbench:{planSnapshot:baseline}});
 expect(useMyStore.getState().evaluations[0].specificationBaseline).toEqual(baseline);
 await useMyStore.getState().reviewScenario('scenario-run',{status:'evidence',note:'Needs investigation',evidence:'Stakeholder interview'});
 useMyStore.getState().openProject('',true);
 expect(useMyStore.getState().evaluations[0]).toMatchObject({specificationBaseline:baseline,resolutionStatus:'open',scenarioReview:{status:'evidence'}});
});
it('requires evidence or a dismissal reason without resolving the issue', async()=>{
 useMyStore.setState({evaluations:[{uid:'scenario',workbench:{},resolutionStatus:'open'}]});
 await expect(useMyStore.getState().reviewScenario('scenario',{status:'evidence',note:'',evidence:''})).rejects.toThrow('evidence');
 await expect(useMyStore.getState().reviewScenario('scenario',{status:'dismissed',note:'',evidence:''})).rejects.toThrow('reason');
 expect(useMyStore.getState().evaluations[0].resolutionStatus).toBe('open');
});
it('updates structured profiles transactionally without appending another persona or deleting collaborators',async()=>{
 onSnapshot.mockImplementation(()=>jest.fn());useMyStore.getState().openProject('shared');
 const people=[{uid:'p',description:'Original'},{uid:'other',description:'Collaborator persona'}];
 const update=jest.fn();runTransaction.mockImplementation(async(db,fn)=>fn({get:async()=>({exists:()=>true,data:()=>({personas:people})}),update}));
 const revised={uid:'p',description:'Original',profile:{goal:'New goal'}};
 expect(await useMyStore.getState().addPersona(revised)).toBe(true);
 expect(update.mock.calls[0][1].personas).toEqual([revised,people[1]]);
});

it('retains generation specifications for published stage notes through refresh',async()=>{
 const baseline=[{uid:'demo-data',stage:'data',description:'Original training data'}];
 await useMyStore.getState().addEvaluation('Visitor',['demo-data'],{uid:'trace-note',type:'persona',problem:'Check the labels',stageTrace:{runId:'r',planSnapshot:baseline,entry:{cardId:'demo-data'}}});
 useMyStore.getState().openProject('',true);
 expect(useMyStore.getState().evaluations[0]).toMatchObject({uid:'trace-note',specificationBaseline:baseline,stageTrace:{runId:'r'},resolutionStatus:'open'});
});

it('saves reviewer scenarios with unset nested fields without passing undefined to Firestore', async () => {
  onSnapshot.mockImplementation(() => jest.fn());
  useMyStore.getState().openProject('cloud-test');
  accountAuthor.mockResolvedValue({ name: 'UX', occupation: 'UX Designer', uid: 'ux' });
  const batch = { set: jest.fn(), update: jest.fn(), commit: jest.fn().mockResolvedValue() };
  writeBatch.mockReturnValue(batch);
  const ok = await useMyStore.getState().addEvaluation('UX', ['data'], { uid: 'scenario-undefined', type: 'persona', problem: 'Check access', workbench: { model: undefined, planSnapshot: [], draftState: { selectedBranchId: undefined, notes: 'Keep this' } } });
  expect(ok).toBe(true);
  const stored = batch.set.mock.calls[0][1];
  expect(stored.workbench).toEqual({ planSnapshot: [], draftState: { notes: 'Keep this' } });
  expect(stored.cardIds).toEqual(['data']);
});

it('does not shrink locally expanded canvas dimensions after adding a block triggers a project snapshot', () => {
 let receiveProject;
 onSnapshot.mockImplementation((ref, callback) => { if (ref.kind === 'projects') receiveProject = callback; return jest.fn(); });
 useMyStore.getState().openProject('viewport-project');
 receiveProject({exists:()=>true,data:()=>({name:'Viewport',cards:[],evaluations:[],canvasScale:{x:2,y:2}})});
 useMyStore.setState({canvasScale:{x:4,y:3}});
 receiveProject({exists:()=>true,data:()=>({name:'Viewport',cards:['new-card'],evaluations:[],canvasScale:{x:2,y:2}})});
 expect(useMyStore.getState().canvasScale).toEqual({x:4,y:3});
 receiveProject({exists:()=>true,data:()=>({name:'Viewport',cards:['new-card'],evaluations:[],canvasScale:{x:5,y:4}})});
 expect(useMyStore.getState().canvasScale).toEqual({x:5,y:4});
});

it('keeps the canvas loaded while newly added block and evaluation documents are pending', () => {
 const subscriptions=new Map();
 onSnapshot.mockImplementation((ref,callback)=>{subscriptions.set(`${ref.kind}/${ref.id}`,callback);return jest.fn();});
 useMyStore.getState().openProject('no-flicker');
 const project=subscriptions.get('projects/no-flicker');
 project({exists:()=>true,data:()=>({name:'Loaded',cards:['first'],evaluations:[]})});
 expect(useMyStore.getState().loadingProject).toBe(true);
 subscriptions.get('cards/first')({exists:()=>true,data:()=>({stage:'task',description:'Existing',position:{x:1000,y:600},comments:[]})});
 expect(useMyStore.getState().loadingProject).toBe(false);
 const loadingStates=[];
 const stop=useMyStore.subscribe(state=>loadingStates.push(state.loadingProject));
 project({exists:()=>true,data:()=>({name:'Loaded',cards:['first','new'],evaluations:['new-evaluation']})});
 expect(loadingStates).not.toContain(true);
 expect(useMyStore.getState().cards.find(c=>c.uid==='first')).toBeDefined();
 subscriptions.get('cards/new')({exists:()=>true,data:()=>({stage:'data',description:'New',position:{x:1400,y:600},comments:[]})});
 subscriptions.get('evaluations/new-evaluation')({exists:()=>true,data:()=>({problem:'New concern',cardIds:['first']})});
 expect(loadingStates).not.toContain(true);
 stop();
});

it('deletes a persona without deleting its evaluation history and keeps it gone after refresh', async()=>{
 await useMyStore.getState().addPersona({uid:'delete-me',description:'Applicant'});
 await useMyStore.getState().addEvaluation('UX',['demo-data'],{uid:'keep-history',type:'persona',personaId:'delete-me',problem:'Keep this concern'});
 expect(await useMyStore.getState().deletePersona('delete-me')).toBe(true);
 expect(useMyStore.getState().personas.some(p=>p.uid==='delete-me')).toBe(false);
 useMyStore.getState().openProject('',true);
 expect(useMyStore.getState().personas.some(p=>p.uid==='delete-me')).toBe(false);
 expect(useMyStore.getState().evaluations.some(e=>e.uid==='keep-history')).toBe(true);
});

it("protects a pending rename from stale snapshots and accepts collaborator names after saving", async () => {
  let receive, acknowledge;
  onSnapshot.mockImplementation((ref, callback) => { receive = callback; return jest.fn(); });
  const snapshot = name => ({ exists: () => true, data: () => ({ name, cards: [], evaluations: [] }) });
  useMyStore.getState().openProject("rename-project");
  receive(snapshot("Untitled project"));
  updateDoc.mockImplementationOnce(() => new Promise(resolve => { acknowledge = resolve; }));
  const saving = useMyStore.getState().setProjectName("Hiring plan");
  await new Promise(resolve => setTimeout(resolve, 0));
  receive(snapshot("Untitled project"));
  expect(useMyStore.getState().projectName).toBe("Hiring plan");
  acknowledge(); await saving;
  receive(snapshot("Collaborator title"));
  expect(useMyStore.getState().projectName).toBe("Collaborator title");
});
it("retains failed renames through snapshots and releases the draft after retry", async () => {
  let receive;
  onSnapshot.mockImplementation((ref, callback) => { receive = callback; return jest.fn(); });
  const snapshot = name => ({ exists: () => true, data: () => ({ name, cards: [], evaluations: [] }) });
  useMyStore.getState().openProject("rename-project");
  updateDoc.mockRejectedValueOnce(new Error("Offline"));
  expect(await useMyStore.getState().setProjectName("My title")).toBe(false);
  receive(snapshot("untitled"));
  expect(useMyStore.getState().projectName).toBe("My title");
  updateDoc.mockResolvedValue(); await useMyStore.getState().retrySaves();
  expect(useMyStore.getState().saveStatus).toBe("saved");
  receive(snapshot("Shared title"));
  expect(useMyStore.getState().projectName).toBe("Shared title");
});
