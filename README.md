# AI LEGO

[AI LEGO: Scaffolding Cross-Functional Collaboration in Industrial Responsible AI Practices during Early Design Stages](https://arxiv.org/abs/2505.10300), CSCW 2026

A collaborative canvas web tool for cross-functional teams to identify and address ethical risks in AI systems during the early design stage.

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment variables**

   Create a `.env` file in the project root:

   ```env
   REACT_APP_API_BASE_URL=        # Leave empty for local dev (proxied via Vercel)
   ```

   The app does not use a shared server-side OpenAI key. Each user enters their own key
   when using an AI feature. The key is retained only in the current tab's memory and is
   not written to browser storage, Firebase, project data, or server storage.

3. **Firebase**

   The Firebase config is in `src/firebase.js`. Replace it with your own project credentials if forking.

4. **Run locally**

   ```bash
   npm start          # React dev server on http://localhost:3000
   vercel dev         # Run with Vercel serverless functions (required for AI features)
   ```

5. **Build**

   ```bash
   npm run build
   ```

## Key Concepts

- **Canvas**: An infinite scrolling workspace where users place and connect stage cards.
- **Stage Cards**: Each card represents one phase of an AI pipeline. Cards link together to form a development plan.
- **Personas**: Stakeholder profiles (manually created or AI-generated), persisted with stable IDs so profiles and their evaluations survive refresh.
- **Evaluations**: Text annotations on cards — either stage-level (user-written) or persona-level (AI-generated via GPT-4 streaming).
- **Snapshots**: Canvas previews are automatically captured after card changes settle, with debouncing and one capture at a time.

## LEGO canvas prototype

Lifecycle bricks snap to the baseplate's 20px stud grid. Drag a brick near another brick's side to see a docking preview; releasing aligns the bricks and creates a directed connection. Click a side clip and then another brick to connect distant stages. Connections use studded beams; hover a beam's clasp and click × to disconnect. Focus a brick's header and use arrow keys to move one stud. Escape cancels a pending connection. Positions and connections use the existing project saving mechanism.

## Reliability

Project notes appear in an expandable text field below the project name. Legacy Note cards are hidden from the canvas and minimap; their text is combined in project order when no project-level `notes` field exists. Editing saves the `notes` field, including an explicit empty string when cleared, while preserving the legacy records. Notes autosave, retain unsaved drafts across refresh, and use the existing save retry feedback.

The original canvas UI and interactions are preserved. Visitor entry opens an isolated browser copy at `/demo`, rather than signing everyone into one shared account. Demo changes stay in browser storage; signed-in projects use Firebase. Existing demo data can be cleared by removing the `ai-lego-demo-v1` browser-storage entry.

Project, card, comment, and evaluation subscriptions update shared projects live and are cleaned up when leaving. Atomic writes keep document references and membership updates together. Stage descriptions and evaluation drafts survive refresh through session storage; forms clear only after a successful save. Failed writes expose retry feedback. Users can save an OpenAI API key in the account menu or the profile popup after registration. Keys are scoped to the signed-in user in tab session storage, cleared on sign-out, and never saved to Firestore. Requests send the key to the API server using `X-OpenAI-API-Key`; the server uses it only for the upstream OpenAI request.

AI requests handle empty responses, interrupted streams, network errors, cancellation, and timeouts without leaving generation controls stuck. Local live AI calls require `vercel dev`; `npm start` serves the interface alone. Sharing a URL does not automatically add project membership; invite collaborators explicitly using the existing Share dialog. Deployed Firebase rules still determine access.

```bash
CI=true npm test -- --watch=false --runInBand
node --test tests/api.test.mjs
npm run build
```

## Deployment

The app is deployed on Vercel. The `vercel.json` config routes `/api/*` to the serverless functions and allows up to 180 seconds per function invocation to accommodate full lifecycle traces.

## Citation

If you use this tool or build upon this work, please cite:

```bibtex
@inproceedings{wu2026ailego,
  title     = {AI LEGO: Scaffolding Cross-Functional Collaboration in Industrial Responsible AI Practices during Early Design Stages},
  author    = {Wu, Muzhe and Zhao, Yanzhi and Han, Shuyi and Liu, Michael Xieyang and Shen, Hong},
  booktitle = {Proceedings of the ACM on Human-Computer Interaction (CSCW)},
  year      = {2026},
  url       = {https://arxiv.org/abs/2505.10300}
}
```

### Demo accounts and collaboration

Create separate accounts for the AI developer, UX designer, and product manager. In each account's menu (top-right avatar), choose **Your role** and use **Randomize avatar** to select a portrait. Open the AI developer's project and use **Share → Invite** with the other accounts' registered emails. Share lists the project's actual members, their roles, and avatars, and updates when membership or profiles change. Open two ordinary browser tabs and sign into a different account in each tab. Sign-in persists across refresh in that tab; signing out affects that tab only, and closing it ends its session. Existing tabs running the older version should be refreshed before the demo. A duplicated tab can initially inherit the original session, so sign out in the duplicate and sign into the second account there. New comments and evaluations save an author profile snapshot (name, role, and avatar), so contributions remain attributed after refresh. Existing contributions retain their original attribution. Roles describe each participant's perspective; all existing collaborators keep the current editing access.

Generated avatars are SVG portraits drawn in the browser from `users/{uid}.avatarSeed`. New accounts get a random seed; older accounts use their UID as a stable fallback until randomized. Uploaded photos take precedence; randomizing switches the account to a generated portrait. No asset download, Firebase Storage upload, new collection, or migration is needed. Existing Firestore rules must allow accounts to update their own `occupation`, `avatarSeed`, and `profile_picture` fields, and project collaborators to read member profiles. This repository does not include the deployed Firestore rules. If profile reads are denied, Share shows “Profile unavailable” instead of omitting a member.

Account roles also select the canvas layout: **Admin** keeps all existing controls; **AI Developer** shows the Lifecycle Blocks palette and hides evaluation/persona authoring controls; **PM / UX** hide the creation palette and open evaluation panels on the right directly by clicking a stage block or persona icon, with the persona list and Create control at the bottom left. Persona creation opens in a centered popup. PM/UX have no evaluation launcher box; each stage and persona keeps its own draft, and plan blocks are read-only in this review view. Existing project blocks remain visible for selecting stages and reviewing the shared plan. Accounts without a recognized role and the public `/demo` keep the Admin layout. These layouts describe the workflow and do not change Firestore access rules.

### Demo AI configuration

Each signed-in user must provide their own OpenAI API key in the profile panel. All three AI endpoints require the `X-OpenAI-API-Key` request header and never read a server or deployment API key. Missing keys return 401 before any upstream request. Do not configure an OpenAI key in frontend environment variables.

### Issue resolution review

New comments and evaluations capture the lifecycle specifications when the issue is raised. AI developers edit existing blocks or add new ones, then choose **Address issue**. The app captures changed and new specifications directly, without AI analysis, summaries, or manual confirmation. Before/now comparisons appear inline beneath the issue, which changes to **Awaiting approval**. All changes since the issue was raised are included; no relevance is inferred. Linked new blocks also display the evaluation they address.

PM/UX compare the original and current text inline, then **Approve resolution** or **Request changes** with feedback. Approval removes the comment from the active list and places it in collapsed **Review history**, including the original comment, before/now specifications, and reviewer identity. Only approval marks an issue **Resolved**; requesting changes reopens it. Proposals and review history are saved on the existing comment/evaluation documents and update through the project's live subscriptions. Approval checks the persisted linked specifications in a Firestore transaction and refuses stale or superseded proposals. Older issues without an original snapshot can still be addressed, with the missing baseline clearly identified. No Firebase assets or new collections are required; existing project collaborators must be allowed to update their shared comment/evaluation documents by the project's Firestore rules.


### Stakeholder scenario workbench

Persona creation now defaults to a short canvas label and a fully expanded profile form with explanations and examples. Relationship to the system, goal, everyday situation, and what the person knows appear first. Specific limitations, assumptions, open questions, and research notes are visible and labeled optional. AI generation fills the form with the first suggestion; selecting another suggestion replaces the draft for review. AI/manual authorship is recorded automatically when fields are generated or edited, without per-field source selectors. Optional research notes support the persona as a whole; earlier field provenance is retained for compatibility. AI generation uses the current project name and all lifecycle blocks in both structured and classic modes. The small **Structured profile** checkbox is checked by default; uncheck it to use Classic paragraph creation through its existing endpoint.

Persona evaluation defaults to **Scenario workbench**. Select a stakeholder and choose a situation. A stakeholder walkthrough derives visible information from the plan and profile, displays it in the step observations, and labels unspecified details as assumptions or unknowns; new scenarios always use the stakeholder walkthrough. Older saved analyst critiques retain their original settings for inspection and replay. Knowledge boundaries are prompting constraints, not a guarantee of behavioral fidelity. The output contains a short walkthrough, one concern, verified exact quotations from identified blocks, assumptions, unknowns, a validation question, a possible mitigation, and alternative continuations. Invalid structures, nonexistent block IDs, and quotations not present in the submitted plan are rejected with a retryable error.

Edit the concern and block links, add team notes, and choose **Save scenario and concern**. Saved records include the original plan and persona, situation, model identifier, prompt version, time, and generated output. The issue-resolution baseline is the plan at generation, even when blocks change before the concern is saved. Browser drafts retain an unsaved run through refresh; saved runs and assessments use the existing project/evaluation persistence paths. Profile edits use a transaction to update by stable persona ID without appending duplicate profiles.

After revising a lifecycle block, **Replay with current plan** or **Replay saved scenario** holds the original persona and triggering situation fixed and compares against that run's plan. The original visible information describes the baseline encounter; an intervention may change what the stakeholder sees in the replay. Every changed block receives an explicit assessment. The comparison retains old/new specifications, the original concern, residual uncertainty, and potential shifted burdens. A replay creates a separate run and never automatically resolves the original issue. Save it to retain it in shared history. Alternative continuations load an assumption into the form for a new exploration. Use the existing human **Address issue / Approve resolution** workflow to close an issue.

The **Before → Outcome → After** timeline combines temporal focus and saved-run counts for the selected stakeholder. Each moment has a guiding question and distinct prompt instructions: understanding and agency before, interpretation and consequences at the outcome, and recourse and adaptation afterward. A specific situation is optional. Earlier scenario types remain in history without being reassigned to a temporal category. These moments are lenses rather than mutually exclusive categories. Evidence may support or contradict a concern; these statuses are not accuracy or fairness scores. Reviewers can record evidence or dismiss an assessment with a reason without marking a mitigation approved. Unchecking **Scenario workbench** switches to Classic persona critique, which preserves the original streaming prompt, editable text, and save behavior. Existing unstructured personas remain usable in either mode; their profile can be filled in without migration.

`/api/workbench` requires the requesting user’s API key and defaults to the existing `gpt-4` model. Set the optional server variable `PERSONA_WORKBENCH_MODEL` to choose another Chat Completions-compatible model. This does not change classic mode. Short requests retain the 50-second server timeout; full lifecycle traces have a 170-second server timeout and remain cancellable. Existing Firestore rules must permit project collaborators to update persona arrays and their evaluation documents; this repository does not contain deployed rules.

Additional endpoint checks:

```bash
node --test tests/api.test.mjs tests/workbench.test.mjs
```

Canvas blocks automatically make room for expanded evaluations and longer descriptions. Measured block heights push overlapping rows downward on the stud grid, keeping each row aligned and connectors attached. Collapsing content restores the available space. This is a local viewing layout: saved manual coordinates stay unchanged until a person moves a block.


**Examine every stage** is an optional full-run mode in the persona workbench. One model call creates the usual scenario and an ordered `stageTrace`, with exactly one entry per actual block. Each entry separates stakeholder experience from analysis of the design, includes verified plan quotations and cross-stage links, and records a potential concern, missing-information question, or no additional concern. The server rejects incomplete coverage, invented block IDs and quotations, unsupported status values, and concerns asserted for blank specifications. Entries are normalized into lifecycle order, preserving order among repeated stages.

**Play trace** moves the persona through the canvas and reveals draft markers; Pause, Next stage, and Clear canvas trace control playback. This is playback of completed AI output, not live analysis progress. Reduced-motion settings disable movement animation. Choose which concern/question notes to publish with **Publish selected stage comments**; no-concern entries are retained in the trace without creating issues. Published notes preserve the original specification snapshot and evidence, use stable IDs for retries, and follow the existing human issue-resolution workflow. Save the scenario separately to retain the entire trace in shared scenario history. Replays preserve whether the original run examined every stage.

Full lifecycle traces stream draft stage comments as they are generated. Starting a full run temporarily hides the workbench and brings the persona onto the first block immediately; subsequent streamed stages move the same avatar smoothly across the canvas. The canvas offers Stop generation and Return to results while streaming. Returning opens the panel without cancelling generation. At completion, the full response is validated before showing save/publish controls. Partial text is labeled unverified and never automatically saved or published. Standard scenarios keep their JSON response contract; full-trace clients request `stream: true` and consume newline-delimited `start`, `progress`, `complete`, or `error` events.

Persona simulation voice: both the workbench and Classic prompts request a concrete first-person account grounded in the supplied persona's goals, circumstances, constraints and knowledge. Classic now sends the structured profile as well as the display description. Full traces generate and stream `stakeholderExperience` first; the separate generic `comment` field is no longer requested. Playback, trace results and stage publications display that experience, including for older saved traces that also contain an analyst comment. Design evidence and validation remain separate metadata. Existing saved narratives are preserved; regenerate a scenario to use the revised voice prompts.

Branching simulation: new workbench runs include two conditional continuations sharing the same first-person encounter and fork. Choose a path in Possible paths; full-trace playback keeps its common block prefix and uses that path's specific experiences. Saving retains both alternatives, the selection, frozen plan connections and persona inputs. Stage publications use independent branch IDs and retain the chosen path context. Canvas connections inform the prompt and traversal; disconnected blocks and feedback cycles are covered once. A connection is a design dependency, not evidence that a stakeholder has an action available. Classic mode also describes two conditional continuations, in its existing text interface. Older saved scenarios remain inspectable and can be regenerated to get structured branches.
