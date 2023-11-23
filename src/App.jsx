import Canvas from "./components/Canvas";
import Menu from "./components/Menu";
const App = () => {
    return (
        <div className="flex h-[calc(100vh-112px)]">
            <div className="flex-none w-fit">
                <Menu />
            </div>
            <div className="flex-auto bg-gray-200 p-4">
                <Canvas />
            </div>
        </div>
    )
}

export default App;