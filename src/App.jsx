import Menu from "./components/Menu";

const App = () => {
    return (
        <div className="flex">
            <div className="w-1/6 h-[calc(100vh-112px)] bg-regular-gray">
                <Menu />
            </div>
            <div className="flex w-max bg-white">
            </div>
        </div>

    )
}

export default App;