# AI LEGO demo scenarios

Ten self-contained authoring-reference JSON files. These do not change the app’s existing demo or constitute native import files.

## Contents

- [Image generation for campaign prototyping](01-image-generation.json) — Paper Appendix E.1; focus: `model`.
- [Urban gunshot detection](02-gunshot-detection.json) — Paper Appendix E.2; focus: `deploy`.
- [Resume screening and recruiter shortlists](03-resume-screening.json) — Paper Appendix E.3; focus: `train`.
- [Vaccine allocation during a fictional shortage](04-vaccine-allocation.json) — Paper Appendix E.4; focus: `data`.
- [Credit-line recommendation](05-credit-assessment.json) — Paper Appendix E.5; focus: `model`.
- [Formative writing feedback](06-classroom-feedback.json) — New demo scenario; focus: `model`.
- [Accessible transit route assistant](07-accessible-transit.json) — New demo scenario; focus: `deploy`.
- [Team meeting summaries and action items](08-meeting-summaries.json) — New demo scenario; focus: `deploy`.
- [Food-rescue pickup allocation](09-food-rescue.json) — New demo scenario; focus: `problem`.
- [Household energy scheduling assistant](10-home-energy.json) — New demo scenario; focus: `feedback`.

## Provenance

The supplied paper’s Appendix E lists **five** system scenarios (E.1–E.5), not six: image generation, gunshot detection, resume screening, vaccine allocation, and credit assessment. Five newly authored scenarios bring the total to ten. Paper: https://doi.org/10.1145/3816897. The paper’s brief requirements are retained at the system level; lifecycle details and demo incidents are proposed elaborations, not claims about the study implementation.

## Using a file

1. Use `proposed_ai_system` and `scenario_notes` to introduce the demo.
2. Copy each `lifecycle_writeup[].writeup` into the matching lifecycle block. Each entry includes the exact current application prompt.
3. Select a block and copy the corresponding `proposed_issue` into Stage Evaluation. Each of the eight stages has its exact evaluation prompt, an illustrative concern, and a proposed revision.
4. Create the three fictional personas from their descriptions. Review assumptions and relevant stages before asking the listed evaluation questions. These are authored suggestions, not precomputed simulation results.
5. Follow the suggested before/after change, discuss its tradeoffs, and retain human review before accepting it.

The initial plans intentionally contain design gaps, so the demonstration has a meaningful evaluation and revision step. Proposed concerns are hypotheses, not measured findings; the five new scenarios and all persona details are fictional. Specialized-domain examples illustrate design review, not medical, lending, hiring, or policing decisions. No numerical performance claims or validated outcomes are asserted.

Prompt source: `src/contexts/projectContext.jsx`, `prompts` and `stageEvaluationPrompts`, read on 2026-10-11. Persona format follows `api/generate.js` (three one-paragraph descriptions using all lifecycle blocks). Fields are copy-ready authoring material; they are not the app’s saved-project schema.
