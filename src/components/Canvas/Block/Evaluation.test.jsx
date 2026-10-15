import { render, screen } from '@testing-library/react';
import EvaluationBox from './Evaluation';
jest.mock('../../../contexts/projectContext', () => ({ __esModule: true, default: selector => selector({ personas: [] }) }));
jest.mock('./IssueResolution', () => ({ __esModule: true, default: () => <details><summary>Review history</summary><p>Archived comment</p></details> }));
it('shows resolved evaluations only through collapsed review history', () => {
 render(<EvaluationBox evaluationData={{uid:'resolved',type:'persona',resolutionStatus:'resolved',problem:'I need my qualifications considered.',author:{name:'Emma'},personaDescription:'Applicant'}} role="reviewer"/>);
 expect(screen.getByText('Review history')).toBeVisible();
 expect(screen.getByText('Archived comment')).not.toBeVisible();
 expect(screen.queryByText('“I need my qualifications considered.”')).not.toBeInTheDocument();
 expect(screen.queryByLabelText('Registered by Emma')).not.toBeInTheDocument();
});
