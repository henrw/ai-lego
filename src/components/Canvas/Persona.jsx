import React, { useState } from 'react';

function PersonaIcon({ imgUrl, description }) {
    const [isHover, setIsHover] = useState(false);
    return (
        <div className='py-2 flex flex-row' onMouseOut={() => setIsHover(false)}>
            <img src={imgUrl} alt="persona lego" width={50} style={{"object-fit": "contain"}} className="" onMouseEnter={() => setIsHover(true)}/>
            {
                isHover &&
                <div className='bg-white ml-2 rounded-lg p-2 w-32 border border-1'>{description}</div>
            }
        </div>
    );
}

export default PersonaIcon;