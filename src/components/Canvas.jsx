
import React from 'react';
import Card from './Card';
import Column from './Column';

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
        // <DndProvider backend={HTML5Backend}>
            <div className={`columns-8 h-full`}>
                {stages.map(stage => {
                    return <Column key={`${stage}-column`} stage={stage} />
                })}
            </div>

        // </DndProvider>
    );
};

export default Canvas;