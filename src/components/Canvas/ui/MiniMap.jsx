import useMyStore, { colorClasses, isNoteCard } from "../../../contexts/projectContext";
import { useEffect, useState } from "react";
import { BOARD_TOP, snapPosition } from "../brickGeometry";

export default function MiniMap({ zoom = 1 }) {
    const cardsData = useMyStore((store) => store.cards).filter(card => !isNoteCard(card));
    const minimapScale = 0.1; // Adjust this scale factor based on your actual minimap size and main canvas size

    const [viewportPosition, setViewportPosition] = useState({ x: 0, y: 0 });
    const canvasScale = useMyStore((store) => store.canvasScale);
    const getBgColorClassFromId = (stage) => {
        const bgColorClass = `bg-${colorClasses[stage]}`;
        return bgColorClass;
    };

    const handleScroll = () => {
        setViewportPosition({ x: window.scrollX, y: window.scrollY });
    };

    useEffect(() => {
        window.addEventListener('scroll', handleScroll, { passive: true });
        window.addEventListener('resize', handleScroll);
        handleScroll();
        return () => { window.removeEventListener('scroll', handleScroll); window.removeEventListener('resize', handleScroll); };
    }, []);

    return (
        <div className="fixed z-10 bottom-2 left-1/2 w-[10%] h-[10%] bg-gray-100 transform -translate-x-1/2"
            onMouseDown={(e) => {
                const bounds = e.currentTarget.getBoundingClientRect();
                window.scrollTo(
                    Math.max((e.clientX - bounds.left) / bounds.width * window.innerWidth * canvasScale.x * zoom - window.innerWidth / 2, 0),
                    Math.max((e.clientY - bounds.top) / bounds.height * window.innerHeight * canvasScale.y * zoom - window.innerHeight / 2, 0)
                );
            }}
        >
            {cardsData.map(card => (
                <div
                    key={"mini_" + card.uid}
                    className={getBgColorClassFromId(card.stage)}
                    style={{
                        position: 'absolute',
                        width: 250 * minimapScale / canvasScale.x,
                        height: 200 * minimapScale / canvasScale.y,
                        left: snapPosition(card.position).x * minimapScale / canvasScale.x,
                        top: (snapPosition(card.position).y + BOARD_TOP) * minimapScale / canvasScale.y
                    }}
                />
            ))}
            <div style={{
                position: 'absolute',
                zIndex: 10,
                border: '1px solid black',
                left: viewportPosition.x / zoom * minimapScale / canvasScale.x,
                top: viewportPosition.y / zoom * minimapScale / canvasScale.y,
                width: window.innerWidth / zoom * minimapScale / canvasScale.x,
                height: window.innerHeight / zoom * minimapScale / canvasScale.y,
            }}
            />
        </div>
    );
}
