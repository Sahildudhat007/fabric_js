import React from "react";
import CanvasEditor from "./Components/CanvasEditor/CanvasEditor";

import './App.css';
import PenTool from "./Components/PenTool/PenTool";

function App() {

  return (
    <>
      <div className="min-h-screen w-full mx-auto bg-gray-100 p-6">
        {/* <CanvasEditor /> */}
        <PenTool />
      </div>
    </>
  )
}

export default App
