import React, { useState } from 'react';

function ThreeDotMenu({ deleteProject, projectId }) {
    const [isOpen, setIsOpen] = useState(false);

    const toggleMenu = (event) => {
        event.stopPropagation();
        setIsOpen(!isOpen);
    };

    return (
        <div className="menu-container">
            <button className="menu-trigger" onClick={toggleMenu}>
                <span>•••</span>
            </button>
            {isOpen && (
                <div className="menu-dropdown rounded-2" onClick={toggleMenu}>
                    <ul>
                        <li><button className='rounded-t-2' onClick={(event) => {
                            event.stopPropagation();
                        }}>Export</button></li>
                        <li><button
                            className='rounded-b-2 button-hover' onClick={(event) => {
                                event.stopPropagation();
                                toggleMenu(event);
                                deleteProject(projectId);
                            }}>Delete</button></li>
                    </ul>
                </div>
            )}
        </div>
    );
}

export default ThreeDotMenu;