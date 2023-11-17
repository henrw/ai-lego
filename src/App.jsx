import Canvas from "./components/Canvas";
import Menu from "./components/Menu";
const App = () => {
    return (
        <div className="flex">
            <div className="w-1/6 h-[calc(100vh-112px)] bg-regular-gray">
                <Menu />
            </div>
            <div className="flex w-5/6 h-[calc(100vh-112px)] bg-white grid grid-cols-8">
                <Canvas />
            </div>
        </div>
    )
}

export default App;