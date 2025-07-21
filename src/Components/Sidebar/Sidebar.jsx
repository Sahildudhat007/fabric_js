import React, { useState } from 'react'

// react icon
import { RiShapesFill } from "react-icons/ri";
import { TfiLayoutLineSolid } from "react-icons/tfi";
import { RxText } from "react-icons/rx";
import { IoCloudUploadOutline } from "react-icons/io5";
import { CiPen } from "react-icons/ci";
import { LuUndo, LuRedo } from "react-icons/lu";

function Sidebar({
    onAddSquare, onAddRectangle, onAddTriangle, onAddCircle, onAddPentagon, onAddHexagon, onAddRoundedOctagon, onAddDiamondStar, onAddStar, onAddLine, onAddText, onUploadImage, onChangeColor, onChangeSize, onActivatePenTool, onUndo, onRedo
}) {

    const [showShapes, setShowShapes] = useState(false);
    const [activeTool, setActiveTool] = useState(null);
    const [activeShape, setActiveShape] = useState(null);

    const toggleShapes = () => {
        setShowShapes(!showShapes);
    };

    const [color, setColor] = useState("#000000");
    const [width, setWidth] = useState(100);
    const [height, setHeight] = useState(100);

    return (
        <>
            <div className="bg-white p-4 w-14 h-full shadow-md rounded-lg flex flex-col items-center text-center space-y-2">
                <button onClick={() => { toggleShapes(); setActiveTool("shapes") }}
                    className={`cursor-pointer hover:bg-gray-200 flex justify-center items-center rounded-md w-10 h-10 text-2xl ${activeTool === "shapes" ? "bg-gray-200" : ""}`}>
                    <RiShapesFill />
                </button>

                <button onClick={() => { onAddLine(); setActiveTool("line") }}
                    className={`cursor-pointer hover:bg-gray-200 flex justify-center items-center rounded-md w-10 h-10 text-2xl ${activeTool === "line" ? "bg-gray-200" : ""}`} >
                    <TfiLayoutLineSolid className='rotate-45' />
                </button>

                <button onClick={() => { onAddText(); setActiveTool("text") }}
                    className={`cursor-pointer hover:bg-gray-200 flex justify-center items-center rounded-md w-10 h-10 text-2xl ${activeTool === "text" ? "bg-gray-200" : ""}`}>
                    <RxText />
                </button>

                <button onClick={() => { onUploadImage(); setActiveTool("upload"); }}
                    className={`cursor-pointer hover:bg-gray-200 flex justify-center items-center rounded-md w-10 h-10 text-2xl ${activeTool === "upload" ? "bg-gray-200" : ""}`}>
                    <IoCloudUploadOutline />
                </button>

                <button onClick={() => { onActivatePenTool(); setActiveTool("pen"); }}
                    className={`cursor-pointer hover:bg-gray-200 flex justify-center items-center rounded-md w-10 h-10 text-2xl ${activeTool === "pen" ? "bg-gray-200" : ""}`}>
                    <CiPen />
                </button>

                <button onClick={() => { onUndo(); setActiveTool("undo"); }}
                    className={`cursor-pointer hover:bg-gray-200 flex justify-center items-center rounded-md w-10 h-10 text-2xl ${activeTool === "undo" ? "bg-gray-200" : ""}`}>
                    <LuUndo />
                </button>

                <button onClick={() => { onRedo(); setActiveTool("redo"); }}
                    className={`cursor-pointer hover:bg-gray-200 flex justify-center items-center rounded-md w-10 h-10 text-2xl ${activeTool === "redo" ? "bg-gray-200" : ""}`}>
                    <LuRedo />
                </button>

                <div>
                    <label className='text-xs'>color</label>
                    <input
                        type="color"
                        value={color}
                        onChange={(e) => { setColor(e.target.value); onChangeColor(e.target.value); }}
                        className="w-8 h-8 cursor-pointer"
                    />
                </div>

                <div>
                    <label>Width:</label>
                    <input
                        type="number"
                        value={width}
                        onChange={(e) => { setWidth(e.target.value); onChangeSize(e.target.value, height); }}
                        className="w-full"
                    />
                </div>

                <div>
                    <label>Height:</label>
                    <input
                        type="number"
                        value={height}
                        onChange={(e) => { setHeight(e.target.value); onChangeSize(width, e.target.value); }}
                        className="w-full"
                    />
                </div>
            </div>

            {/* Shapes Box */}
            {showShapes && (
                <div className='ml-2 bg-white h-[27.5rem] rounded-lg shadow-lg p-4 overflow-y-auto flex flex-col items-center space-y-1 absolute left-20'>
                    {[
                        { onClick: onAddSquare, viewBox: "0 0 64 64", path: "M0 0H64V64H0z" },
                        { onClick: onAddRectangle, viewBox: "0 0 64 64", path: "M10,0L54,0C59.5228,0 64,4.4771 64,10L64,54C64,59.5228 59.5228,64 54,64L10,64C4.4771,64 0,59.5228 0,54L0,10C0,4.4771 4.4771,0 10,0" },
                        { onClick: onAddCircle, viewBox: "0 0 64 64", path: "M32 0A32 32 0 1 0 32 64A32 32 0 1 0 32 0Z" },
                        { onClick: onAddTriangle, viewBox: "0 0 64 64", path: "M32 0L64 56H0L32 0Z" },
                        { onClick: onAddPentagon, viewBox: "0 0 64 64", path: "M32 0L64 24.4458L51.7771 64H12.2229L0 24.4458L32 0Z" },
                        { onClick: onAddHexagon, viewBox: "0 0 55 64", path: "M27.5 0L55 16V48L27.5 64L0 48V16L27.5 0Z" },
                        { onClick: onAddRoundedOctagon, viewBox: "0 0 64 64", path: "M45.25 0L64 18.75L64 45.25L45.25 64L18.75 64L0 45.25L0 18.75L18.75 0L45.25 0Z" },
                        { onClick: onAddDiamondStar, viewBox: "0 0 64 64", path: "M32 0L42.1823 21.8177L64 32L42.1823 42.1823L32 64L21.8177 42.1823L0 32L21.8177 21.8177L32 0Z" },
                        { onClick: onAddStar, viewBox: "0 0 64 61", path: "M32 0L39.5542 23.2999H64L44.2229 37.7001L51.7771 61L32 46.5999L12.2229 61L19.7771 37.7001L0 23.2999H24.4458L32 0Z" },
                    ].map((shape, index) => (
                        <button
                            key={index}
                            onClick={() => { shape.onClick(); setActiveShape(index); }}
                            className={`cursor-pointer p-2 flex justify-center items-center rounded-md w-10 h-10 text-2xl hover:bg-gray-200 ${activeShape === index ? 'bg-gray-200' : ''}`}
                        >
                            <svg viewBox={shape.viewBox} width="24" height="24">
                                <path d={shape.path} vectorEffect="non-scaling-stroke" fill="black" />
                            </svg>
                        </button>
                    ))}
                </div >
            )}
        </>
    )
}

export default Sidebar