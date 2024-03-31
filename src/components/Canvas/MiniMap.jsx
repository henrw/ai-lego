import useMyStore, { prompts, colorClasses } from "../../contexts/projectContext";
import { useState } from "react";

export default function MiniMap() {
    const cardsData = useMyStore((store) => store.cards);
    const minimapScale = 0.1; // Adjust this scale factor based on your actual minimap size and main canvas size

    const [viewportPosition, setViewportPosition] = useState({x: 0, y: 0});
    const canvasScale = useMyStore((store) => store.canvasScale);
    const getBgColorClassFromId = (stage) => {
        const bgColorClass = `bg-${colorClasses[stage]}`;
        return bgColorClass;
    };

    const handleScroll = () => {
        setViewportPosition({x: window.scrollX, y: window.scrollY});
    };

    window.addEventListener('scroll', handleScroll);

    return (
        <div className="fixed bottom-2 left-1/2 w-[10%] h-[10%] bg-gray-100 transform -translate-x-1/2">
            {cardsData.map(card => (
                <button
                    key={"mini_" + card.uid}
                    className={getBgColorClassFromId(card.stage)}
                    style={{
                        position: 'absolute',
                        zIndex: 10,
                        width: 250 * minimapScale / canvasScale.x,
                        height: 200 * minimapScale / canvasScale.y,
                        left: card.position.x * minimapScale / canvasScale.x,
                        top: card.position.y * minimapScale / canvasScale.y
                    }}
                />
            ))}
            <div style={{
                position: 'absolute',
                border: '1px solid black',
                left: viewportPosition.x * minimapScale / canvasScale.x,
                top: viewportPosition.y * minimapScale / canvasScale.y,
                width: window.innerWidth * minimapScale / canvasScale.x,
                height: window.innerHeight * minimapScale / canvasScale.y,
            }} />
        </div>
    );
}