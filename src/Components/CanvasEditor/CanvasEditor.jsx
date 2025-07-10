import React, { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';
import Sidebar from '../Sidebar/Sidebar';
import ShapeToolbar from '../ShapeEditor/ShapeEditor';

function CanvasEditor() {
    const canvasRef = useRef(null);
    const fabricRef = useRef(null);
    const fileInputRef = useRef(null);
    const isPenToolActiveRef = useRef(false);

    const [toolbarPos, setToolbarPos] = useState(null);
    const [selectedObject, setSelectedObject] = useState(null);

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
            width: 500,
            height: 500,
            backgroundColor: "#fff",
        });
        fabricRef.current = canvas;

        const createCircle = (x, y, fill = 'white', stroke = true, visible = false) =>
            new fabric.Circle({
                left: x,
                top: y,
                radius: 6,
                fill,
                stroke: stroke ? 'black' : '',
                strokeWidth: stroke ? 1 : 0,
                originX: 'center',
                originY: 'center',
                hasControls: false,
                hasBorders: false,
                selectable: true,
                evented: true,
                visible,
                hoverCursor: 'pointer',
            });

        const createLine = (p1, p2, visible = false) =>
            new fabric.Line([p1.left, p1.top, p2.left, p2.top], {
                stroke: 'gray',
                selectable: false,
                evented: false,
                visible,
            });

        const handleMouseDown = (opt) => {
            if (!isPenToolActiveRef.current) return;

            const canvas = fabricRef.current;
            const pointer = canvas.getPointer(opt.e);
            const { anchors, isDrawing } = state.current;

            if (!isDrawing) return;

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

            const anchor = createCircle(pointer.x, pointer.y);
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

                const dx = pointer.x - prev.anchor.left;
                const dy = pointer.y - prev.anchor.top;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const offset = 50;
                const ux = dx / dist;
                const uy = dy / dist;

                const dirOut = createCircle(
                    prev.anchor.left + ux * offset,
                    prev.anchor.top + uy * offset,
                    'gray', true, true
                );
                const dirIn = createCircle(
                    pointer.x - ux * offset,
                    pointer.y - uy * offset,
                    'gray', true, true
                );

                canvas.add(dirOut, dirIn);

                prev.dirOut = dirOut;
                anchorData.dirIn = dirIn;

                const lineOut = createLine(prev.anchor, dirOut);
                const lineIn = createLine(anchor, dirIn);

                canvas.add(lineOut, lineIn);

                prev.dirLineOut = lineOut;
                anchorData.dirLineIn = lineIn;

                const path = new fabric.Path(
                    `M ${prev.anchor.left} ${prev.anchor.top} L ${anchor.left} ${anchor.top}`,
                    {
                        stroke: 'blue',
                        fill: '',
                        selectable: true,
                        evented: true,
                        objectCaching: false,
                        hasBorders: false,
                        hasControls: false,
                        lockScalingX: true,
                        lockScalingY: true,
                        lockRotation: true,
                    }
                );
                canvas.add(path);
                state.current.paths.push(path);

                canvas.bringToFront(lineOut);
                canvas.bringToFront(lineIn);
                canvas.bringToFront(dirOut);
                canvas.bringToFront(dirIn);
                canvas.bringToFront(prev.anchor);
                canvas.bringToFront(anchor);
            }

            canvas.renderAll();
        };

        const handleMouseMove = (opt) => {
            if (!isPenToolActiveRef.current) return;

            const canvas = fabricRef.current;
            const pointer = canvas.getPointer(opt.e);
            const { anchors, isDrawing } = state.current;

            if (!isDrawing || anchors.length < 1) return;

            const last = anchors[anchors.length - 1];

            if (last && last.anchor) {
                if (state.current.tempLine) canvas.remove(state.current.tempLine);

                const preview = new fabric.Line(
                    [last.anchor.left, last.anchor.top, pointer.x, pointer.y],
                    {
                        stroke: 'lightgray',
                        selectable: false,
                        evented: false,
                    }
                );

                state.current.tempLine = preview;
                canvas.add(preview);
                canvas.renderAll();
            }
        };

        const finishPath = () => {
            const { paths, tempLine, anchors } = state.current;
            const canvas = fabricRef.current;

            if (tempLine) canvas.remove(tempLine);

            paths.forEach(p => {
                p.selectable = true;
                p.evented = true;
            });

            // Show all anchors and bring them to front
            anchors.forEach(pt => {
                pt.anchor.set({ visible: true, evented: true });
                pt.dirIn?.set({ visible: true, evented: true });
                pt.dirOut?.set({ visible: true, evented: true });
                pt.dirLineIn?.set({ visible: true });
                pt.dirLineOut?.set({ visible: true });

                // Bring all points and lines above path
                canvas.bringToFront(pt.dirLineIn);
                canvas.bringToFront(pt.dirLineOut);
                canvas.bringToFront(pt.dirIn);
                canvas.bringToFront(pt.dirOut);
                canvas.bringToFront(pt.anchor);
            });

            canvas.renderAll();
            isPenToolActiveRef.current = false;
        };

        canvas.on('mouse:down', handleMouseDown);
        canvas.on('mouse:move', handleMouseMove);

        canvas.on('object:moving', (e) => {
            const moved = e.target;
            const { anchors, paths } = state.current;

            // Only proceed if the moved object is an anchor or direction point
            const isAnchor = anchors.some(pt =>
                pt.anchor === moved || pt.dirIn === moved || pt.dirOut === moved
            );
            if (!isAnchor) return;

            anchors.forEach(pt => {
                if (pt.dirLineOut && pt.anchor && pt.dirOut) {
                    pt.dirLineOut.set({
                        x1: pt.anchor.left,
                        y1: pt.anchor.top,
                        x2: pt.dirOut.left,
                        y2: pt.dirOut.top
                    });
                }
                if (pt.dirLineIn && pt.anchor && pt.dirIn) {
                    pt.dirLineIn.set({
                        x1: pt.anchor.left,
                        y1: pt.anchor.top,
                        x2: pt.dirIn.left,
                        y2: pt.dirIn.top
                    });
                }
            });

            paths.forEach((path, i) => {
                const from = anchors[i];
                const to = anchors[i + 1];
                if (!to) return;

                const updatedPath = new fabric.Path(
                    `M ${from.anchor.left} ${from.anchor.top} C ${from.dirOut.left} ${from.dirOut.top}, ${to.dirIn.left} ${to.dirIn.top}, ${to.anchor.left} ${to.anchor.top}`,
                    {
                        stroke: 'blue',
                        fill: '',
                        selectable: true,
                        evented: true,
                        hasBorders: false,
                        hasControls: false,
                        lockScalingX: true,
                        lockScalingY: true,
                        lockRotation: true,
                    }
                );

                fabricRef.current.remove(path);
                fabricRef.current.add(updatedPath);
                paths[i] = updatedPath;
            });

            canvas.renderAll();
        });

        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                state.current.anchors.forEach((a) => canvas.remove(a.anchor));
                state.current.paths.forEach((p) => canvas.remove(p));
                if (state.current.tempLine) canvas.remove(state.current.tempLine);
                state.current = {
                    anchors: [],
                    paths: [],
                    isDrawing: true,
                    currentLine: null,
                    doubleClickTimer: null,
                    tempLine: null,
                    selectedAnchor: null,
                };
                isPenToolActiveRef.current = false;
                canvas.renderAll();
            }
        });

        const handleSelection = (e) => {
            const canvas = fabricRef.current;

            if (e.selected && e.selected.length > 0) {
                const obj = e.selected[0];
                updateToolbar(obj);
                setSelectedObject(obj);

                // If anchor is selected
                if (obj && obj.type === 'circle' && obj.radius === 6) {
                    // This is likely an anchor or handle
                    obj.set({ stroke: '' }); // Just a test highlight (optional)
                    canvas.renderAll();
                }

                // If path is selected, show connected points
                if (obj.type === 'path') {
                    const index = state.current.paths.indexOf(obj);
                    if (index !== -1) {
                        const from = state.current.anchors[index];
                        const to = state.current.anchors[index + 1];

                        if (from) {
                            from.anchor.set({ visible: true });
                            from.dirIn?.set({ visible: true });
                            from.dirOut?.set({ visible: true });
                            from.dirLineIn?.set({ visible: true });
                            from.dirLineOut?.set({ visible: true });
                        }

                        if (to) {
                            to.anchor.set({ visible: true });
                            to.dirIn?.set({ visible: true });
                            to.dirOut?.set({ visible: true });
                            to.dirLineIn?.set({ visible: true });
                            to.dirLineOut?.set({ visible: true });
                        }

                        canvas.renderAll();
                    }
                }

            } else {
                setToolbarPos(null);
                setSelectedObject(null);
            }
        };

        function handleMove(e) {
            if (e.target === canvas.getActiveObject()) updateToolbar(e.target);
        }

        // Selection events
        canvas.on('selection:created', handleSelection);
        canvas.on('selection:updated', handleSelection);
        canvas.on('selection:cleared', () => {
            setToolbarPos(null);
            setSelectedObject(null);

            const { anchors } = state.current;
            anchors.forEach(pt => {
                pt.anchor.set({ visible: false });
                pt.dirIn?.set({ visible: false });
                pt.dirOut?.set({ visible: false });
                pt.dirLineIn?.set({ visible: false });
                pt.dirLineOut?.set({ visible: false });
            });

            canvas.renderAll();
        });
        canvas.on('object:moving', handleMove);

        return () => canvas.dispose();
    }, []);

    const updateToolbar = (obj) => {
        if (!obj) return;
        setSelectedObject(obj);

        const bounds = obj.getBoundingRect();
        const canvasBox = canvasRef.current.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

        setToolbarPos({
            top: bounds.top + canvasBox.top + scrollTop - 10,
            left: bounds.left + canvasBox.left + scrollLeft + bounds.width / 2,
        });
    };

    const activatePenTool = () => {
        isPenToolActiveRef.current = true;
        state.current = {
            anchors: [],
            paths: [],
            isDrawing: true,
            currentLine: null,
            doubleClickTimer: null,
            tempLine: null,
            selectedAnchor: null,
        };
        fabricRef.current.discardActiveObject();
        fabricRef.current.renderAll();
    };

    const addSquare = () => {
        const square = new fabric.Rect({ left: 190, top: 140, width: 100, height: 100, fill: "black", });
        fabricRef.current.add(square);
    };

    const addRectangle = () => {
        const rect = new fabric.Rect({ left: 190, top: 140, width: 120, height: 80, rx: 6, ry: 6, fill: "black", });
        fabricRef.current.add(rect);
    };

    const addTriangle = () => {
        const triangle = new fabric.Triangle({ left: 190, top: 140, width: 100, height: 100, fill: "black", });
        fabricRef.current.add(triangle);
    };

    const addCircle = () => {
        const circle = new fabric.Circle({ left: 190, top: 140, width: 150, height: 150, radius: 50, fill: "black", });
        fabricRef.current.add(circle);
    };

    const addLine = () => {
        const line = new fabric.Line([500, 100, 650, 100], { left: 190, top: 140, stroke: 'black', strokeWidth: 2, });
        fabricRef.current.add(line);
    };

    const addPentagon = () => {
        const pentagon = new fabric.Polygon([
            { x: 50, y: 0 }, { x: 100, y: 38 }, { x: 82, y: 95 }, { x: 18, y: 95 }, { x: 0, y: 38 }
        ], {
            left: 190,
            top: 140,
            fill: 'black',
            selectable: true
        });
        fabricRef.current.add(pentagon);
    }

    const addHexagon = () => {
        const hexagon = new fabric.Polygon([
            { x: 50, y: 0 }, { x: 100, y: 25 }, { x: 100, y: 75 }, { x: 50, y: 100 }, { x: 0, y: 75 }, { x: 0, y: 25 }
        ], {
            left: 190,
            top: 140,
            fill: 'black',
            selectable: true
        });
        fabricRef.current.add(hexagon);
    }

    const addRoundedOctagon = () => {
        const roundedoctagon = new fabric.Polygon([
            { x: 10, y: 30 }, { x: 30, y: 10 }, { x: 70, y: 10 }, { x: 90, y: 30 }, { x: 90, y: 70 }, { x: 70, y: 90 }, { x: 30, y: 90 }, { x: 10, y: 70 }
        ], {
            left: 190,
            top: 140,
            fill: "black",
            originX: "center",
            originY: "center"
        });
        fabricRef.current.add(roundedoctagon);
    }

    const addDiamondStar = () => {
        const diamondstar = new fabric.Polygon([
            { x: 40, y: 0 }, { x: 55, y: 30 }, { x: 80, y: 40 }, { x: 55, y: 50 }, { x: 40, y: 80 }, { x: 25, y: 50 }, { x: 0, y: 40 }, { x: 25, y: 30 }
        ], {
            left: 190,
            top: 140,
            fill: 'black',
            originX: 'center',
            originY: 'center'
        });
        fabricRef.current.add(diamondstar);
    }

    const addStar = () => {
        const star = new fabric.Polygon([
            { x: 40, y: 0 }, { x: 48, y: 28 }, { x: 80, y: 30 }, { x: 55, y: 50 }, { x: 65, y: 80 }, { x: 40, y: 62 }, { x: 15, y: 80 }, { x: 25, y: 50 }, { x: 0, y: 30 }, { x: 32, y: 28 }
        ], {
            left: 190,
            top: 140,
            fill: 'black',
            originX: 'center',
            originY: 'center'
        });
        fabricRef.current.add(star);
    }

    const addText = () => {
        const text = new fabric.IText("Edit me", { left: 190, top: 140, fontSize: 24, fill: "black", });
        fabricRef.current.add(text);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (f) => {
            fabric.Image.fromURL(f.target.result, (img) => {
                img.set({
                    left: 190,
                    top: 140,
                    scaleX: 0.5,
                    scaleY: 0.5,
                });
                fabricRef.current.add(img);
            });
        };
        reader.readAsDataURL(file);
    };

    const uploadImage = () => {
        fileInputRef.current.click();
    };

    const deleteSelected = () => {
        const canvas = fabricRef.current;
        const activeObject = fabricRef.current.getActiveObject();

        if (activeObject) {
            fabricRef.current.remove(activeObject);
            setToolbarPos(null);
        }

        const pathIndex = state.current.paths.indexOf(activeObject);

        if (pathIndex !== -1) {
            const { anchors, paths } = state.current;

            const from = anchors[pathIndex];
            const to = anchors[pathIndex + 1];

            canvas.remove(paths[pathIndex]);

            if (from) {
                canvas.remove(from.anchor);
                if (from.dirOut) canvas.remove(from.dirOut);
                if (from.dirLineOut) canvas.remove(from.dirLineOut);
            }

            if (to) {
                canvas.remove(to.anchor);
                if (to.dirIn) canvas.remove(to.dirIn);
                if (to.dirLineIn) canvas.remove(to.dirLineIn);
            }

            paths.splice(pathIndex, 1);
            anchors.splice(pathIndex + 1, 1);

            canvas.discardActiveObject();
            canvas.renderAll();
            setToolbarPos(null);
            return;
        }

        canvas.remove(activeObject);
        canvas.discardActiveObject();
        canvas.renderAll();
        setToolbarPos(null);
    };

    const changeColor = (newColor) => {
        const activeObject = fabricRef.current.getActiveObject();
        if (activeObject && activeObject.set) {
            if (activeObject.type === "line") {
                activeObject.set("stroke", newColor);
            } else {
                activeObject.set("fill", newColor);
            }
            fabricRef.current.renderAll();
        }
    };

    const duplicateObject = () => {
        if (selectedObject) {
            selectedObject.clone((cloned) => {
                cloned.left += 20;
                cloned.top += 20;
                fabricRef.current.add(cloned);
                fabricRef.current.setActiveObject(cloned);
                fabricRef.current.renderAll();
            });
        }
    };

    const changeSize = (newWidth, newHeight) => {
        const activeObject = fabricRef.current.getActiveObject();
        if (activeObject && activeObject.set && activeObject.type !== "line") {
            activeObject.set({
                width: parseFloat(newWidth),
                height: parseFloat(newHeight),
                scaleX: 1,
                scaleY: 1,
            });
            fabricRef.current.renderAll();
        }
    };

    return (
        <>
            <div className="flex items-center">
                <Sidebar
                    onAddSquare={addSquare}
                    onAddRectangle={addRectangle}
                    onAddTriangle={addTriangle}
                    onAddCircle={addCircle}
                    onAddPentagon={addPentagon}
                    onAddHexagon={addHexagon}
                    onAddRoundedOctagon={addRoundedOctagon}
                    onAddDiamondStar={addDiamondStar}
                    onAddStar={addStar}

                    onAddLine={addLine}
                    onAddText={addText}
                    onActivatePenTool={activatePenTool}
                    onUploadImage={uploadImage}
                    onDelete={deleteSelected}
                    onChangeColor={changeColor}
                    onChangeSize={changeSize}
                />
                <div className="flex-grow flex justify-center items-center p-4">
                    <canvas ref={canvasRef} className="border border-gray-300 shadow-md" />
                    <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                    />
                </div>

                {toolbarPos && (
                    <ShapeToolbar
                        position={toolbarPos}
                        onDuplicate={() => duplicateObject()}
                        onDelete={() => deleteSelected()}
                    />
                )}
            </div>
        </>
    )
}

export default CanvasEditor