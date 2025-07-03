import React, { useState } from 'react'

// react icon
import { RiShapesFill } from "react-icons/ri";
import { TfiLayoutLineSolid } from "react-icons/tfi";
import { RxText } from "react-icons/rx";
import { IoCloudUploadOutline } from "react-icons/io5";
import { CiPen } from "react-icons/ci";
// import { use } from 'react';

function Sidebar({ onAddSquare, onAddRectangle, onAddTriangle, onAddCircle, onAddLine, onAddText, onUploadImage, onChangeColor, onChangeSize, onActivatePenTool, }) {

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
                <button onClick={() => {
                    toggleShapes();
                    setActiveTool("shapes")
                }}
                    className={`cursor-pointer hover:bg-gray-200 flex justify-center items-center rounded-md w-10 h-10 text-2xl ${activeTool === "shapes" ? "bg-gray-200" : ""}`}>
                    <RiShapesFill />
                </button>
                <button onClick={() => {
                    onAddLine();
                    setActiveTool("line")
                }}
                    className={`cursor-pointer hover:bg-gray-200 flex justify-center items-center rounded-md w-10 h-10 text-2xl ${activeTool === "line" ? "bg-gray-200" : ""}`} >
                    <TfiLayoutLineSolid className='rotate-45' />
                </button>
                <button onClick={() => {
                    onAddText();
                    setActiveTool("text")
                }}
                    className={`cursor-pointer hover:bg-gray-200 flex justify-center items-center rounded-md w-10 h-10 text-2xl ${activeTool === "text" ? "bg-gray-200" : ""}`}>
                    <RxText />
                </button>
                <button onClick={() => {
                    onUploadImage();
                    setActiveTool("upload");
                }}
                    className={`cursor-pointer hover:bg-gray-200 flex justify-center items-center rounded-md w-10 h-10 text-2xl ${activeTool === "upload" ? "bg-gray-200" : ""}`}>
                    <IoCloudUploadOutline />
                </button>
                <button onClick={() => {
                    onActivatePenTool();
                    setActiveTool("pen");
                }}
                    className={`cursor-pointer hover:bg-gray-200 flex justify-center items-center rounded-md w-10 h-10 text-2xl ${activeTool === "pen" ? "bg-gray-200" : ""}`}>
                    <CiPen />
                </button>

                <div className="">
                    <label className='text-xs'>color</label>
                    <input
                        type="color"
                        value={color}
                        onChange={(e) => {
                            setColor(e.target.value);
                            onChangeColor(e.target.value);
                        }}
                        className="w-8 h-8 cursor-pointer"
                    />
                </div>

                <div>
                    <label>Width:</label>
                    <input
                        type="number"
                        value={width}
                        onChange={(e) => {
                            setWidth(e.target.value);
                            onChangeSize(e.target.value, height);
                        }}
                        className="w-full"
                    />
                </div>

                <div>
                    <label>Height:</label>
                    <input
                        type="number"
                        value={height}
                        onChange={(e) => {
                            setHeight(e.target.value);
                            onChangeSize(width, e.target.value);
                        }}
                        className="w-full"
                    />
                </div>
            </div>

            {/* Shapes Box */}
            {showShapes && (
                <div className='ml-2 bg-white h-96 rounded-lg shadow-lg p-4 overflow-y-auto flex flex-col items-center space-y-1 absolute left-20'>
                    {[
                        { onClick: onAddSquare, viewBox: "0 0 64 64", path: "M0 0H64V64H0z" },
                        { onClick: onAddRectangle, viewBox: "0 0 64 64", path: "M10,0L54,0C59.5228,0 64,4.4771 64,10L64,54C64,59.5228 59.5228,64 54,64L10,64C4.4771,64 0,59.5228 0,54L0,10C0,4.4771 4.4771,0 10,0" },
                        { onClick: onAddCircle, viewBox: "0 0 64 64", path: "M32 0A32 32 0 1 0 32 64A32 32 0 1 0 32 0Z" },
                        { onClick: onAddTriangle, viewBox: "0 0 64 64", path: "M32 0L64 56H0L32 0Z" },
                        { onClick: onAddSquare, viewBox: "0 0 64 56", path: "M32 56L64 0H0L32 56Z" },
                        { onClick: onAddSquare, viewBox: "0 0 64 64", path: "M32 0L64 32L32 64L0 32L32 0Z" },
                        { onClick: onAddSquare, viewBox: "0 0 64 64", path: "M32 0L64 24.4458L51.7771 64H12.2229L0 24.4458L32 0Z" },
                        { onClick: onAddSquare, viewBox: "0 0 55 64", path: "M27.5 0L55 16V48L27.5 64L0 48V16L27.5 0Z" },
                        { onClick: onAddSquare, viewBox: "0 0 64 55", path: "M64 27.5L48 55L16 55L0 27.5L16 0L48 0L64 27.5Z" },
                        { onClick: onAddSquare, viewBox: "0 0 64 64", path: "M45.25 0L64 18.75L64 45.25L45.25 64L18.75 64L0 45.25L0 18.75L18.75 0L45.25 0Z" },
                        { onClick: onAddSquare, viewBox: "0 0 64 64", path: "M51.4 0H12.6L0 12.6V51.4L12.6 64H51.4L64 51.4V12.6L51.4 0Z" },
                        { onClick: onAddSquare, viewBox: "0 0 64 64", path: "M32 0L42.1823 21.8177L64 32L42.1823 42.1823L32 64L21.8177 42.1823L0 32L21.8177 21.8177L32 0Z" },
                        { onClick: onAddSquare, viewBox: "0 0 64 61", path: "M32 0L39.5542 23.2999H64L44.2229 37.7001L51.7771 61L32 46.5999L12.2229 61L19.7771 37.7001L0 23.2999H24.4458L32 0Z" },
                        { onClick: onAddSquare, viewBox: "0 0 56 64", path: "M28 0L39.3484 12.5456L56 16L50.6968 32L56 48L39.3484 51.4544L28 64L16.6516 51.4544L0 48L5.3032 32L0 16L16.6516 12.5456L28 0Z" },
                        { onClick: onAddSquare, viewBox: "0 0 64 64", path: "M32 0L41.1844 9.82689L54.6274 9.37258L54.1731 22.8156L64 32L54.1731 41.1844L54.6274 54.6274L41.1844 54.1731L32 64L22.8156 54.1731L9.37258 54.6274L9.82689 41.1844L0 32L9.82689 22.8156L9.37258 9.37258L22.8156 9.82689L32 0Z" },
                        { onClick: onAddSquare, viewBox: "0 0 64 64", path: "M32 0L42.5682 6.48614L54.6274 9.37258L57.5139 21.4318L64 32L57.5139 42.5682L54.6274 54.6274L42.5682 57.5139L32 64L21.4318 57.5139L9.37258 54.6274L6.48614 42.5682L0 32L6.48614 21.4318L9.37258 9.37258L21.4318 6.48614L32 0Z" },
                        { onClick: onAddSquare, viewBox: "0 0 64 64", path: "M32 0L38.2117 8.81778L48 4.28719L48.9706 15.0294L59.7128 16L55.1822 25.7883L64 32L55.1822 38.2117L59.7128 48L48.9706 48.9706L48 59.7128L38.2117 55.1822L32 64L25.7883 55.1822L16 59.7128L15.0294 48.9706L4.28719 48L8.81778 38.2117L0 32L8.81778 25.7883L4.28719 16L15.0294 15.0294L16 4.28719L25.7883 8.81778L32 0Z" },
                        { onClick: onAddSquare, viewBox: "0 0 64 64", path: "M32 0L36.7241 6.89458L43.6093 2.17944L45.5344 10.3223L53.6506 8.42343L52.5168 16.7149L60.7679 17.8887L56.7282 25.2088L64 29.2968L57.6 34.6571L62.9103 41.1072L55.0143 43.7837L57.646 51.7247L49.3205 51.3558L48.918 59.7153L41.2874 56.351L37.9052 64L32 58.0946L26.0948 64L22.7126 56.351L15.082 59.7153L14.6795 51.3558L6.35405 51.7247L8.98564 43.7837L1.08972 41.1072L6.4 34.6571L0 29.2968L7.27178 25.2088L3.23205 17.8887L11.4832 16.7149L10.3494 8.42343L18.4656 10.3223L20.3907 2.17944L27.2759 6.89458L32 0Z" },
                        { onClick: onAddSquare, viewBox: "0 0 64 64", path: "M32 0L36.5053 3.55458L41.8885 1.56619L45.0749 6.33901L50.8091 6.11146L52.3647 11.6353L57.8885 13.1909L57.661 18.9251L62.4338 22.1115L60.4454 27.4947L64 32L60.4454 36.5053L62.4338 41.8885L57.661 45.0749L57.8885 50.8091L52.3647 52.3647L50.8091 57.8885L45.0749 57.661L41.8885 62.4338L36.5053 60.4454L32 64L27.4947 60.4454L22.1115 62.4338L18.9251 57.661L13.1909 57.8885L11.6353 52.3647L6.11146 50.8091L6.33901 45.0749L1.56619 41.8885L3.55458 36.5053L0 32L3.55458 27.4947L1.56619 22.1115L6.33901 18.9251L6.11146 13.1909L11.6353 11.6353L13.1909 6.11146L18.9251 6.33901L22.1115 1.56619L27.4947 3.55458L32 0Z" },
                        { onClick: onAddSquare, viewBox: "0 0 64 64", path: "M32 0L35.1044 2.6258L38.6898 0.699276L41.1774 3.9096L45.0873 2.76655L46.8493 6.42107L50.9127 6.11146L51.8723 10.0505L55.9116 10.5878L56.0267 14.6392L59.8655 16L59.1311 19.9866L62.6014 22.1115L61.0497 25.8591L64 28.6551L61.6987 32L64 35.3449L61.0497 38.1409L62.6014 41.8885L59.1311 44.0134L59.8655 48L56.0267 49.3608L55.9116 53.4122L51.8723 53.9495L50.9127 57.8885L46.8493 57.5789L45.0873 61.2335L41.1774 60.0904L38.6898 63.3007L35.1044 61.3742L32 64L28.8956 61.3742L25.3102 63.3007L22.8226 60.0904L18.9127 61.2335L17.1507 57.5789L13.0873 57.8885L12.1277 53.9495L8.08838 53.4122L7.97326 49.3608L4.13454 48L4.8689 44.0134L1.39855 41.8885L2.9503 38.1409L0 35.3449L2.30131 32L0 28.6551L2.9503 25.8591L1.39855 22.1115L4.8689 19.9866L4.13454 16L7.97326 14.6392L8.08838 10.5878L12.1277 10.0505L13.0873 6.11146L17.1507 6.42107L18.9127 2.76655L22.8226 3.9096L25.3102 0.699276L28.8956 2.6258L32 0Z" },
                        { onClick: onAddSquare, viewBox: "0 0 64 64", path: "M64 32L32 0V16H0V48H32V64L64 32Z" },
                        { onClick: onAddSquare, viewBox: "0 0 64 64", path: "M0 32L32 0V16H64V48H32V64L0 32Z" },
                        { onClick: onAddSquare, viewBox: "0 0 64 64", path: "M32 0L0 32L16 32L16 64L48 64L48 32L64 32L32 0Z" },
                        { onClick: onAddSquare, viewBox: "0 0 64 64", path: "M32 64L0 32L16 32L16 0L48 0L48 32L64 32L32 64Z" },
                        { onClick: onAddSquare, viewBox: "0 0 64 42", path: "M21.5 0L0 21L21.5 42V31.5H42.5V42L64 21L42.5 0V10.5H21.5V0Z" },
                        { onClick: onAddSquare, viewBox: "0 0 42 64", path: "M0 42.5L21 64L42 42.5H31.5L31.5 21.5H42L21 0L0 21.5H10.5V42.5H0Z" },
                        { onClick: onAddSquare, viewBox: "0 0 64 32", path: "M48 0H0V32H48L64 16L48 0Z" },
                        { onClick: onAddSquare, viewBox: "0 0 64 32", path: "M0 0H48L64 16L48 32H0L16 16L0 0Z" },
                        { onClick: onAddSquare, viewBox: "0 0 64 32", path: "M64 0H0L8 16L0 32H64L56 16L64 0Z" },
                        { onClick: onAddSquare, viewBox: "0 0 64 32", path: "M48 0H16L0 16L16 32H48L64 16L48 0Z" },
                        { onClick: onAddSquare, viewBox: "0 0 64 32", path: "M48 0A16 16 0 01 48 32H16A16 16 0 01 16 0Z" },
                        { onClick: onAddSquare, viewBox: "0 0 64 64", path: "M64 0H0V49.2H12.4V64L36.5 49.2H64L64 0Z" },
                        { onClick: onAddSquare, viewBox: "0 0 64 56", path: "M41.7615 0H22.2368C9.95482 0 0 9.72535 0 21.7221C0 30.407 5.21881 37.8984 12.7588 41.3741V56L27.8617 43.4435H41.7615C54.0443 43.4435 64 33.7181 64 21.7213C64.0009 9.72535 54.0443 0 41.7615 0Z" },
                        { onClick: onAddSquare, viewBox: "0 0 64 56", path: "M2.53725 8.94154C-2.65195 17.4906 1.00387 25.8117 5.59813 30.2281L32.4604 56L58.7557 30.3202C63.0287 25.5693 64.6666 20.5299 63.7569 14.9185C62.5004 7.1561 56.1037 1.13372 48.2017 0.273726C43.3553 -0.248088 38.6736 1.12342 35.0197 4.15976C34.0362 4.97672 33.1572 5.89005 32.3911 6.88277C31.4821 5.75248 30.4163 4.71854 29.2108 3.80219C25.009 0.608875 19.6604 -0.658994 14.5228 0.327059C9.65689 1.26705 5.28924 4.40582 2.53725 8.94154Z" },
                        { onClick: onAddSquare, viewBox: "0 0 64 64", path: "M44 0H20V20H0V44H20V64H44V44H64V20H44V0Z" },
                        { onClick: onAddSquare, viewBox: "0 0 64 42", path: "M36.3378 0C37.0398 0 37.746 0 38.4466 0C44.0323 0.701488 47.5231 3.03656 49.1131 6.85746C58.4254 6.34791 65.196 13.5727 61.0698 20.6635C62.4419 22.1535 63.5866 23.8202 64 26.0572C64 26.698 64 27.3373 64 27.978C62.768 33.6714 57.4667 37.5186 48.7634 36.4829C46.5241 39.4062 42.5395 42.3337 36.3391 41.9691C33.1342 41.7772 30.9046 40.6656 28.9525 39.3151C26.8964 40.4377 24.6696 41.3187 21.4522 41.3284C14.0087 41.345 9.02929 37.0201 8.90858 31.0878C4.12339 29.7 0.882395 27.1095 0 22.6768C0 22.0361 0 21.394 0 20.756C0.973964 16.3635 4.03876 13.6044 9.14167 12.4348C8.83505 5.02503 19.0423 0.394932 27.4278 3.65934C29.4243 2.04509 32.249 0.284462 36.3378 0Z" },
                        { onClick: onAddSquare, viewBox: "0 0 50 64", path: "M50 0V55L25 64L0 55L0 0H50Z" },
                        { onClick: onAddSquare, viewBox: "0 0 58 64", path: "M58 0V64L29 54L0 64L0 0H58Z" },
                        { onClick: onAddSquare, viewBox: "0 0 64 56", path: "M0 4L32 0L64 4V52L32 56L0 52V4Z" },
                        { onClick: onAddSquare, viewBox: "0 0 64 64", path: "M57.7466 0H6.25339C6.25339 3.44086 3.47078 6.25339 0 6.25339V57.7466C3.44086 57.7466 6.25339 60.5292 6.25339 64H57.7466C57.7466 60.5591 60.5292 57.7466 64 57.7466V6.25339C60.5591 6.25339 57.7466 3.47078 57.7466 0Z" },
                        { onClick: onAddSquare, viewBox: "0 0 64 48", path: "M16 0H64L48 48H0L16 0Z" },
                        { onClick: onAddSquare, viewBox: "0 0 64 48", path: "M48 0H0L16 48H64L48 0Z" },
                        { onClick: onAddSquare, viewBox: "0 0 64 48", path: "M16 0H48L64 48H0L16 0Z" },
                        { onClick: onAddSquare, viewBox: "0 0 64 48", path: "M16 48H48L64 0H0L16 48Z" },
                        { onClick: onAddSquare, viewBox: "0 0 52 64", path: "M17.3427 62.4985C20.0086 63.4051 23.0394 64 26.014 64C28.9887 64 31.8511 63.49 34.4889 62.5834C34.5451 62.5551 34.6012 62.5551 34.6573 62.5268C44.5634 58.9004 51.8597 49.3245 52 38.1337V0H0V38.1054C0.140313 49.3811 7.32434 58.9571 17.3427 62.4985Z" },
                    ].map((shape, index) => (
                        <button
                            key={index}
                            onClick={() => {
                                shape.onClick();
                                setActiveShape(index);
                            }}
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