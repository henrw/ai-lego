export const DEMO_STORAGE_KEY = "ai-lego-demo-v1";
export function createDemoProject() {
  const stages = [
    ["problem", "Help recruiters identify qualified applicants while reducing time spent screening resumes."],
    ["task", "Extract skills and experience, compare them with job requirements, and rank applicants for recruiter review."],
    ["data", "Train on historical resumes and hiring decisions. Clean text and extract education, skills, job titles, and employment dates."],
    ["model", "Use an NLP model to extract resume features and a ranking model to estimate similarity to past successful applicants."],
    ["train", "Train using past hiring decisions as labels. Optimize ranking quality on a held-out sample."],
    ["test", "Measure precision and recall against past hiring decisions. Check whether top-ranked candidates match recruiter choices."],
    ["deploy", "Show recruiters a ranked shortlist inside their applicant tracking system. Recruiters make the final hiring decision."],
    ["feedback", "Collect recruiter feedback and hiring outcomes monthly to update the model."],
  ];
  const cards = stages.map(([stage, description], i) => ({ uid: `demo-${stage}`, stage, description, comments: [], position: { x: 180 + (i % 4) * 280, y: 60 + Math.floor(i / 4) * 280 } }));
  return { projectId: "demo", projectName: "Resume screening · Your demo", notes: "", cards, links: cards.slice(1).map((card, i) => ({ start: cards[i].uid, end: card.uid })), evaluations: [], personas: [], canvasScale: { x: 1.1, y: 1.1 } };
}
