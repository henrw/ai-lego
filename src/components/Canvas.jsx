
import React from 'react';
import Card from './Card';
import Column from './Column';
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'

const Canvas = () => {

    const stages = [
        "Problem Formulation",
        "Task Definition",
        "Dataset Construction",
        "Model Definition",
        "Training Process",
        "Testing Process",
        "Deployment",
        "Feedback"
    ];

    return (
        <DndProvider backend={HTML5Backend}>
            {stages.map(stage => {
                return <Column key={`${stage}-column`} stage={stage} />
            })}
        </DndProvider>
    );
};

export default Canvas;