import React from 'react';

export default function PlanBasis({ evidence, planSnapshot }) {
  const cardIds = [...new Set(evidence.map(item => item.cardId))];
  if (!cardIds.length) return null;
  return <div className="plan-basis" aria-label="Basis in the plan">
    <div className="plan-basis-labels">{cardIds.map(cardId => <span key={cardId}>{planSnapshot.find(card => card.uid === cardId)?.stage || cardId}</span>)}</div>
  </div>;
}
