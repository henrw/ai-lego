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

## Reliability

The original canvas UI and interactions are preserved. Visitor entry opens an isolated browser copy at `/demo`, rather than signing everyone into one shared account. Demo changes stay in browser storage; signed-in projects use Firebase. Existing demo data can be cleared by removing the `ai-lego-demo-v1` browser-storage entry.

Project, card, comment, and evaluation subscriptions update shared projects live and are cleaned up when leaving. Atomic writes keep document references and membership updates together. Stage descriptions and evaluation drafts survive refresh through session storage; forms clear only after a successful save. Failed writes expose retry feedback. API keys remain in memory only.

AI requests handle empty responses, interrupted streams, network errors, cancellation, and timeouts without leaving generation controls stuck. Local live AI calls require `vercel dev`; `npm start` serves the interface alone. Sharing a URL does not automatically add project membership; invite collaborators explicitly using the existing Share dialog. Deployed Firebase rules still determine access.

```bash
CI=true npm test -- --watch=false --runInBand
node --test tests/api.test.mjs
npm run build
```

## Deployment

The app is deployed on Vercel. The `vercel.json` config routes `/api/*` to the serverless functions and sets a 60-second function timeout for streaming responses.

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
