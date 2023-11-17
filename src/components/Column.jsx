// Column.jsx
import React, { useState } from "react";
import Card from "./Card";

const Column = ({ stage }) => {
  const [cards, setCards] = useState([]);

  const addCard = () => {
    const newCards = [...cards, ""];
    setCards(newCards);
  };

  const handleDelete = (id) => {
    const newCards = cards.filter((_, index) => index !== id);
    setCards(newCards);
  };

  return (
    <div className="flex flex-col items-center border-dashed border-black border-r-2 p-4">
      <p className="font-bold h-20">{stage}</p>
      <div className="card-collector w-full">
        {cards.map((_, idx) => (
          <Card
            key={`${stage}-card-${idx}`}
            id={idx}
            handleDelete={handleDelete}
          />
        ))}
      </div>
      <button className="text-lg" onClick={addCard}>
        ➕
      </button>
    </div>
  );
};

export default Column;
