import React, { useEffect, useRef } from "react";
import { fabric } from "fabric";
import { PenTool } from "fabric-pen-tool";

export default function PenToolCanvas() {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = new fabric.Canvas(canvasRef.current, {
            width: 1000,
            height: 700,
            selection: false,
            fireMiddleClick: true,
            stopContextMenu: true,
        });

        const pen = new PenTool(canvas, {
            pathStyle: { stroke: "#000", strokeWidth: 2, fill: "" },
            subColor: "#00aaff",                 // guide stroke color
            controlPointFillColor: "#00aaff",   // bezier handle color
        });

        pen.open();

        // Double-click closes path (if enough points)
        canvas.on("mouse:dblclick", () => {
            if (pen.isOpen && pen.pathContainer.length > 2) pen.close();
        });

        // ALT-click breaks handle symmetry (like Figma)
        canvas.on("mouse:down", (opt) => {
            if (opt.e.altKey && pen.isOpen && pen.currentPoint) {
                pen.currentPoint.mode = "broken";
            }
        });

        // Escape: close open path or destroy pen tool
        const onKeyDown = (e) => {
            if (e.key === "Escape") {
                pen.isOpen ? pen.close() : pen.destroy();
            }
            // Ctrl+Z / Cmd+Z: undo last point
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
                pen.undo();
            }
        };
        window.addEventListener("keydown", onKeyDown);

        return () => {
            window.removeEventListener("keydown", onKeyDown);
            pen.destroy();
            canvas.dispose();
        };
    }, []);

    return <canvas ref={canvasRef} style={{ border: "1px solid #ddd" }} />;
}
