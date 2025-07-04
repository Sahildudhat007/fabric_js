import React, { useEffect, useRef } from 'react';
import { fabric } from 'fabric';

function PenTool() {

    const canvasRef = useRef(null);
    const fabricRef = useRef(null);

    const state = useRef({
        anchors: [],
        paths: [],
        isDrawing: true,
        currentLine: null,
        doubleClickTimer: null,
        tempLine: null,
        selectedAnchor: null,
    });

    useEffect(() => {
        const canvas = new fabric.Canvas(canvasRef.current, {
            width: 1000,
            height: 600,
            backgroundColor: '#fff',
            selection: false,
        });
        fabricRef.current = canvas;

        canvas.on('mouse:down', handleMouseDown);
        canvas.on('mouse:move', handleMouseMove);
        canvas.on('object:moving', handleObjectMove);

        return () => canvas.dispose();
    }, []);

    const handleMouseDown = (opt) => {
        const canvas = fabricRef.current;
        const pointer = canvas.getPointer(opt.e);
        const { anchors, isDrawing } = state.current;

        if (!isDrawing) return;

        // double-click to finish path
        if (state.current.doubleClickTimer) {
            clearTimeout(state.current.doubleClickTimer);
            state.current.doubleClickTimer = null;

            state.current.isDrawing = false;
            finishPath();
            return;
        }

        state.current.doubleClickTimer = setTimeout(() => {
            state.current.doubleClickTimer = null;
        }, 300);

        const anchor = createCircle(pointer.x, pointer.y, 'white', true);
        canvas.add(anchor);

        const anchorData = {
            anchor,
            dirIn: null,
            dirOut: null,
            dirLineIn: null,
            dirLineOut: null,
        };

        anchors.push(anchorData);

        if (anchors.length > 1) {
            const prev = anchors[anchors.length - 2];

            const dirOut = createCircle(prev.anchor.left + 50, prev.anchor.top, 'gray');
            const dirIn = createCircle(pointer.x - 50, pointer.y, 'gray');

            canvas.add(dirOut, dirIn);
            prev.dirOut = dirOut;
            anchorData.dirIn = dirIn;

            const lineOut = createLine(prev.anchor, dirOut);
            const lineIn = createLine(anchor, dirIn);
            canvas.add(lineOut, lineIn);
            prev.dirLineOut = lineOut;
            anchorData.dirLineIn = lineIn;

            const path = new fabric.Path(
                `M ${prev.anchor.left} ${prev.anchor.top} C ${dirOut.left} ${dirOut.top}, ${dirIn.left} ${dirIn.top}, ${anchor.left} ${anchor.top}`,
                {
                    stroke: 'purple',
                    fill: '',
                    selectable: false,
                }
            );
            state.current.paths.push(path);
            canvas.add(path);
        }

        canvas.renderAll();
    };

    const handleMouseMove = (opt) => {
        const canvas = fabricRef.current;
        const pointer = canvas.getPointer(opt.e);
        const { anchors, isDrawing } = state.current;

        if (!isDrawing || anchors.length < 1) return;

        const last = anchors[anchors.length - 1];

        if (last && last.anchor) {
            if (state.current.tempLine) {
                canvas.remove(state.current.tempLine);
            }

            const previewLine = new fabric.Line(
                [last.anchor.left, last.anchor.top, pointer.x, pointer.y],
                {
                    stroke: 'lightgray',
                    selectable: false,
                }
            );
            state.current.tempLine = previewLine;
            canvas.add(previewLine);
            canvas.renderAll();
        }
    };

    const handleObjectMove = () => {
        const canvas = fabricRef.current;
        const { anchors, paths } = state.current;

        // Update all curves and direction lines dynamically
        anchors.forEach((pt) => {
            if (pt.dirLineOut && pt.anchor && pt.dirOut) {
                pt.dirLineOut.set({ x1: pt.anchor.left, y1: pt.anchor.top, x2: pt.dirOut.left, y2: pt.dirOut.top });
            }
            if (pt.dirLineIn && pt.anchor && pt.dirIn) {
                pt.dirLineIn.set({ x1: pt.anchor.left, y1: pt.anchor.top, x2: pt.dirIn.left, y2: pt.dirIn.top });
            }
        });

        paths.forEach((path, i) => {
            const from = anchors[i];
            const to = anchors[i + 1];
            if (!to) return;

            const p = new fabric.Path(
                `M ${from.anchor.left} ${from.anchor.top} C ${from.dirOut.left} ${from.dirOut.top}, ${to.dirIn.left} ${to.dirIn.top}, ${to.anchor.left} ${to.anchor.top}`,
                {
                    stroke: 'purple',
                    fill: '',
                    selectable: false,
                }
            );
            canvas.remove(path);
            canvas.add(p);
            paths[i] = p;
        });

        canvas.renderAll();
    };

    const createCircle = (x, y, fill, stroke = false) =>
        new fabric.Circle({
            left: x,
            top: y,
            radius: 5,
            fill,
            stroke: stroke ? 'black' : '',
            strokeWidth: stroke ? 1 : 0,
            originX: 'center',
            originY: 'center',
            hasControls: false,
            hasBorders: false,
            selectable: true,
        });

    const createLine = (p1, p2) =>
        new fabric.Line([p1.left, p1.top, p2.left, p2.top], {
            stroke: 'lightgray',
            selectable: false,
            evented: false,
        });

    const finishPath = () => {
        const canvas = fabricRef.current;
        state.current.isDrawing = false;

        if (state.current.tempLine) {
            canvas.remove(state.current.tempLine);
            state.current.tempLine = null;
        }

        // Make the full curve path selectable
        state.current.paths.forEach((p) => {
            p.selectable = true;
            p.evented = true;

            // Attach click handler to each path
            canvas.on('mouse:down', (opt) => {
                const clickedObj = opt.target;
                const pointer = canvas.getPointer(opt.e);

                // If clicked on a path, try to highlight closest anchor
                if (clickedObj && state.current.paths.includes(clickedObj)) {
                    const anchor = findClosestAnchor(pointer);
                    if (anchor) {
                        showSelectedAnchor(anchor);
                    }
                } else {
                    // Clicked elsewhere — clear selection
                    if (state.current.selectedAnchor) {
                        canvas.remove(state.current.selectedAnchor);
                        state.current.selectedAnchor = null;
                        canvas.renderAll();
                    }
                }
            });
        });

        canvas.renderAll();
    };

    const findClosestAnchor = (point) => {
        const anchors = state.current.anchors.map((a) => a.anchor);
        let closest = null;
        let minDist = Infinity;

        anchors.forEach((a) => {
            const dx = a.left - point.x;
            const dy = a.top - point.y;
            const dist = dx * dx + dy * dy;
            if (dist < minDist) {
                minDist = dist;
                closest = a;
            }
        });

        return closest;
    };

    const showSelectedAnchor = (anchor) => {
        const canvas = fabricRef.current;

        // Remove old selected anchor highlight
        if (state.current.selectedAnchor) {
            canvas.remove(state.current.selectedAnchor);
            state.current.selectedAnchor = null;
        }

        const highlight = new fabric.Circle({
            left: anchor.left,
            top: anchor.top,
            radius: 7,
            fill: 'transparent',
            stroke: 'red',
            strokeWidth: 2,
            originX: 'center',
            originY: 'center',
            selectable: false,
            evented: false,
        });

        state.current.selectedAnchor = highlight;
        canvas.add(highlight);
        canvas.bringToFront(highlight);
        canvas.renderAll();
    };

    return (
        <>
            <div>
                <h2 className="text-lg font-semibold p-2">Figma-like Pen Tool</h2>
                <canvas ref={canvasRef} />
            </div>
        </>
    )
}

export default PenTool