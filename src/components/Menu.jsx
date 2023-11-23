import React, { useState } from "react";

const Menu = () => {
    // State for each checklist item
    const [checklist, setChecklist] = useState({
        stages: {
            problem: true,
            taskDef: true,
            data: true,
            modelDef: true,
            training: true,
            testing: true,
            deploy: true,
            feedback: true,
        },
        concepts: {
            bias: true,
            impartiality: true,
            equality: true,
            equity: true,
            transparency: true,
            accountability: true,
        },
        stakeholders: {
            users: true,
            business: true,
            clients: true,
            bvi: false,
        },
    });

    // Function to toggle the checked state
    const toggleCheck = (category, item) => {
        setChecklist((prevState) => ({
            ...prevState,
            [category]: {
                ...prevState[category],
                [item]: !prevState[category][item],
            },
        }));
    };

    return (
        <div className="flex flex-col items-left">
            <div className="m-4 flex flex-col items-center">
                <img src="/profile_pic.svg" width={150} alt="profile" />
                <p className="text-lg">Product Managers</p>
                <p className="italic text-gray-500">Permission: Edit/Review</p>
            </div>
            <div className="m-6 flex flex-col items-left">
                <p className="font-bold text-lg">Team Members:</p>
                <div className="flex flex-row">
                    <img
                        src="/profile_pic.svg"
                        width={50}
                        alt="profile"
                        className="m-1"
                    />
                    <div className="flex flex-col align-left m-1">
                        <p>[Data Scientist] Steven Lee</p>
                        <p className="text-gray-500">Data Aquisition - 1h ago</p>
                    </div>
                </div>
                <div className="flex flex-row">
                    <img
                        src="/profile_pic.svg"
                        width={50}
                        alt="profile"
                        className="m-1"
                    />
                    <div className="flex flex-col align-left m-1">
                        <p>[Data Scientist] Steven Lee</p>
                        <p className="text-gray-500">Data Aquisition - 1h ago</p>
                    </div>
                </div>
            </div>

            <div className="checklist m-6 flex flex-col items-left">
                <div className="my-3">
                    <p className="font-bold text-lg">Stages</p>
                    {Object.keys(checklist.stages).map((stage) => (
                        <div key={stage} className="checklist-item">
                            <label className="flex flex-row">
                                {stage.charAt(0).toUpperCase() + stage.slice(1)}
                                <input
                                    type="checkbox"
                                    className="ml-auto"
                                    checked={checklist.stages[stage]}
                                    onChange={() => toggleCheck("stages", stage)}
                                />
                            </label>
                        </div>
                    ))}
                </div>
                <div className="my-3">
                    <p className="font-bold text-lg">Concepts</p>
                    {Object.keys(checklist.concepts).map((concept) => (
                        <div key={concept} className="checklist-item">
                            <label className="flex flex-row">
                                {concept.charAt(0).toUpperCase() + concept.slice(1)}
                                <input
                                    type="checkbox"
                                    className="ml-auto"
                                    checked={checklist.concepts[concept]}
                                    onChange={() => toggleCheck("concepts", concept)}
                                />
                            </label>
                        </div>
                    ))}
                </div>
                <div className="my-3">
                    <p className="font-bold text-lg">Stakeholders</p>
                    {Object.keys(checklist.stakeholders).map((stakeholder) => (
                        <div key={stakeholder} className="checklist-item">
                            <label className="flex flex-row">
                                {stakeholder.charAt(0).toUpperCase() + stakeholder.slice(1)}
                                <input
                                    type="checkbox"
                                    className="ml-auto"
                                    checked={checklist.stakeholders[stakeholder]}
                                    onChange={() => toggleCheck("stakeholders", stakeholder)}
                                />
                            </label>
                        </div>
                    ))}
                </div>

            </div>
        </div>
    );
};

export default Menu;
