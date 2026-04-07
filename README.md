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

   Set the following in your Vercel project settings (do not commit to `.env`):

   ```
   OPENAI_API_KEY=sk-...
   ```

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
- **Personas**: Stakeholder profiles (manually created or AI-generated) that can be used to simulate impact assessments.
- **Evaluations**: Text annotations on cards — either stage-level (user-written) or persona-level (AI-generated via GPT-4 streaming).
- **Snapshots**: The canvas is automatically captured as an image and stored in Firebase Storage whenever cards change.

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
