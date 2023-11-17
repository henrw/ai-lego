
import React, { useState } from 'react';
import Card from './Card';

const Column = ({ stage }) => {

    const [cards, setCards] = useState([]);

    const addCard = () => {
        const tmpcards = [...cards];
        tmpcards.push("")
        setCards(tmpcards);
    }

    return (
        <div className='flex flex-col items-center border-dashed border-black border-r-2 p-4'>
            <p className='font-bold h-20'>{stage}</p>
            <div className='card-collector w-full'>
                {cards.map((_, idx)=>{return <Card key={`${stage}-card-${idx}`} />;})}
            </div>
            <button className='text-lg' onClick={addCard}>
                ➕
            </button>
        </div>
    );
};

export default Column;

