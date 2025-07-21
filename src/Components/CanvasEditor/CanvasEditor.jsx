import React, { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';
import Sidebar from '../Sidebar/Sidebar';
import ShapeToolbar from '../ShapeEditor/ShapeEditor';

function CanvasEditor() {
    const canvasRef = useRef(null);
    const fabricRef = useRef(null);
    const fileInputRef = useRef(null);
    const isPenToolActiveRef = useRef(false);
    const isDrawingRef = useRef(false);
    const points = useRef([]);
    const groupItems = useRef([]);
    const tempGrayLineRef = useRef(null);
    const wasDoubleClickRef = useRef(false);
    const currentPathRef = useRef(null);
    const diamondGroupRefs = useRef([]);
    const lastDrawnLineRef = useRef(null);
    const undoStack = useRef([]);
    const redoStack = useRef([]);
    const allAnchors = useRef([]);

    const [toolbarPos, setToolbarPos] = useState(null);
    const [selectedObject, setSelectedObject] = useState(null);

    useEffect(() => {
        const canvas = new fabric.Canvas(canvasRef.current, {
            width: 500,
            height: 500,
            backgroundColor: '#fff'
        });
        fabricRef.current = canvas;

        const handleMouseDown = (opt) => {
            const canvas = fabricRef.current;
            const pointer = canvas.getPointer(opt.e);
            const point = { x: pointer.x, y: pointer.y };
            const target = opt.target;

            // Hide all diamond handles and direction lines when clicking on canvas
            // if (!target) {
            //     clearDiamondHandles();
            // }

            // Prevent drawing if:
            // 1. Pen tool is not active
            // 2. It was a double click
            // 3. The target is a pen-line (we'll handle this separately)
            // 4. Any other target is clicked
            if (!isPenToolActiveRef.current || wasDoubleClickRef.current || (target && target.customType !== 'pen-line')) {
                return;
            }

            saveState();

            const anchor = drawAnchor(point);
            const newPoint = { ...point, anchor };
            const len = points.current.length;

            // Only draw line if this is not the first point
            if (len > 0) {
                const from = points.current[len - 1];

                // Avoid drawing duplicate line if already created between same points
                const existing = lastDrawnLineRef.current;
                if (existing && existing.customProps &&
                    existing.customProps.from.x === from.x &&
                    existing.customProps.from.y === from.y &&
                    existing.customProps.to.x === point.x &&
                    existing.customProps.to.y === point.y) {
                    return;
                }

                const tempLine = new fabric.Line([from.x, from.y, point.x, point.y], {
                    stroke: 'lightblue',
                    strokeWidth: 1,
                    selectable: true,
                    hasBorders: false,
                    hasControls: false,
                    evented: true,
                    customType: 'pen-line',
                    customProps: { from, to: point }
                });

                canvas.add(tempLine);
                canvas.sendToBack(tempLine);
                lastDrawnLineRef.current = tempLine;
            }

            points.current.push(newPoint);

            if (tempGrayLineRef.current) {
                canvas.remove(tempGrayLineRef.current);
                tempGrayLineRef.current = null;
            }
        };

        // const clearDiamondHandles = () => {
        //     const canvas = fabricRef.current;
        //     // Remove any existing diamond handles and direction lines
        //     canvas.getObjects().forEach(obj => {
        //         if (obj.customType === 'diamond' ||
        //             obj.customType === 'bezier-handle' ||
        //             obj.customType === 'handleLine') {
        //             canvas.remove(obj);
        //         }
        //     });
        //     diamondGroupRefs.current = [];
        // };

        const clearAllBezierControls = () => {
            const canvas = fabricRef.current;
            // Remove all bezier controls (handles, lines, and anchors)
            canvas.getObjects().forEach(obj => {
                if (obj.customType === 'bezier-handle' ||
                    obj.customType === 'handleLine' ||
                    obj.customType === 'anchor') {
                    canvas.remove(obj);
                }
            });
            diamondGroupRefs.current = [];
            allAnchors.current = [];
        };

        const drawAnchor = (point) => {
            const canvas = fabricRef.current;
            const anchor = new fabric.Circle({
                left: point.x,
                top: point.y,
                radius: 5,
                fill: '#fff',
                stroke: '#3b82f6',
                strokeWidth: 1,
                originX: 'center',
                originY: 'center',
                selectable: true,
                hasBorders: false,
                hasControls: false,
                customType: 'anchor',
            });
            canvas.add(anchor);
            canvas.bringToFront(anchor);
            allAnchors.current.push(anchor);
            return anchor;
        };

        const handleMouseMove = (opt) => {
            const canvas = fabricRef.current;

            // Show gray line only if pen tool is active and drawing is not finished
            if (!isPenToolActiveRef.current || wasDoubleClickRef.current) return;

            const pointer = canvas.getPointer(opt.e);

            if (points.current.length > 0) {
                const from = points.current[points.current.length - 1];

                // Remove old gray line
                if (tempGrayLineRef.current) {
                    canvas.remove(tempGrayLineRef.current);
                    tempGrayLineRef.current = null;
                }

                // Draw new temporary gray line
                const grayLine = new fabric.Line([from.x, from.y, pointer.x, pointer.y], {
                    stroke: '#94a3b8',
                    strokeWidth: 1,
                    selectable: false,
                    evented: false
                });

                canvas.add(grayLine);
                canvas.bringToFront(grayLine);
                tempGrayLineRef.current = grayLine;
            }
        };

        const handleDoubleClick = () => {
            saveState();
            const canvas = fabricRef.current;
            wasDoubleClickRef.current = true;

            if (tempGrayLineRef.current) {
                canvas.remove(tempGrayLineRef.current);
                tempGrayLineRef.current = null;
            }

            // 🧼 Remove any existing diamond handles
            // canvas.getObjects().forEach(obj => {
            //     if (obj.customType === 'diamond') canvas.remove(obj);
            // });

            clearAllBezierControls();

            canvas.selection = true;
            canvas.skipTargetFind = false;

            canvas.forEachObject(obj => {
                obj.selectable = true;
            });

            isDrawingRef.current = false;
            isPenToolActiveRef.current = false;
            currentPathRef.current = null;
        };

        canvas.on("selection:created", handleSelection);
        canvas.on("selection:updated", handleSelection);
        canvas.on("selection:cleared", () => {
            setToolbarPos(null);
            setSelectedObject(null);
        });

        canvas.on('object:moving', (opt) => {
            const obj = opt.target;
            const canvas = fabricRef.current;

            if (obj.customType === 'bezier-handle') {
                const path = obj.associatedPath;
                const props = path.customProps;

                const h1 = props.handle1;
                const h2 = props.handle2;

                // Update direction lines
                props.anchorToHandle1.set({
                    x1: props.from.x,
                    y1: props.from.y,
                    x2: h1.left,
                    y2: h1.top,
                });

                props.anchorToHandle2.set({
                    x1: props.to.x,
                    y1: props.to.y,
                    x2: h2.left,
                    y2: h2.top,
                });

                // ✅ Rebuild path (do not recreate, just update path array directly)
                const newPathString = `M ${props.from.x} ${props.from.y} C ${h1.left} ${h1.top}, ${h2.left} ${h2.top}, ${props.to.x} ${props.to.y}`;
                const updated = new fabric.Path(newPathString);

                // Update the internal path array directly (no recreate)
                path.path = updated.path;
                path.set({ dirty: true });
                path.setCoords();
            }
            else if (obj.customType === 'pen-line') {
                // When moving a pen-line, update all related objects
                const { from, to } = obj.customProps;

                // Calculate the movement delta
                const deltaX = obj.left - obj.originalLeft;
                const deltaY = obj.top - obj.originalTop;

                // Update the line points
                obj.set({
                    x1: from.x + deltaX,
                    y1: from.y + deltaY,
                    x2: to.x + deltaX,
                    y2: to.y + deltaY,
                    left: null,
                    top: null
                });

                // Update anchor positions if they exist
                if (from.anchor) {
                    from.anchor.set({
                        left: from.x + deltaX,
                        top: from.y + deltaY
                    });
                    from.x += deltaX;
                    from.y += deltaY;
                }

                if (to.anchor) {
                    to.anchor.set({
                        left: to.x + deltaX,
                        top: to.y + deltaY
                    });
                    to.x += deltaX;
                    to.y += deltaY;
                }

                // Update any associated bezier paths and handles
                const allObjects = canvas.getObjects();
                allObjects.forEach(otherObj => {
                    if (otherObj.customType === 'pen-path' &&
                        otherObj.customProps.from.x === from.x - deltaX &&
                        otherObj.customProps.from.y === from.y - deltaY &&
                        otherObj.customProps.to.x === to.x - deltaX &&
                        otherObj.customProps.to.y === to.y - deltaY) {

                        const props = otherObj.customProps;

                        // Update the from/to positions
                        props.from.x += deltaX;
                        props.from.y += deltaY;
                        props.to.x += deltaX;
                        props.to.y += deltaY;

                        // Update the path
                        const newPathString = `M ${from.x} ${from.y} C ${props.handle1.left} ${props.handle1.top}, ${props.handle2.left} ${props.handle2.top}, ${to.x} ${to.y}`;
                        const updated = new fabric.Path(newPathString);
                        otherObj.path = updated.path;

                        // Update direction lines
                        props.anchorToHandle1.set({
                            x1: from.x,
                            y1: from.y,
                            x2: props.handle1.left,
                            y2: props.handle1.top
                        });

                        props.anchorToHandle2.set({
                            x1: to.x,
                            y1: to.y,
                            x2: props.handle2.left,
                            y2: props.handle2.top
                        });
                    }
                });

                canvas.requestRenderAll();
            }
            else if (obj.customType === 'anchor') {
                // Find all lines connected to this anchor
                const allObjects = canvas.getObjects();

                // Update position of the anchor
                // from = { x: obj.left, y: obj.top };

                // Update connected lines
                allObjects.forEach(otherObj => {
                    if (otherObj.customType === 'pen-line') {
                        const lineProps = otherObj.customProps;

                        if (lineProps.from.anchor === obj) {
                            // This is the starting anchor
                            lineProps.from.x = obj.left;
                            lineProps.from.y = obj.top;
                            otherObj.set({
                                x1: obj.left,
                                y1: obj.top
                            });
                        }
                        else if (lineProps.to.anchor === obj) {
                            // This is the ending anchor
                            lineProps.to.x = obj.left;
                            lineProps.to.y = obj.top;
                            otherObj.set({
                                x2: obj.left,
                                y2: obj.top
                            });
                        }
                    }
                    else if (otherObj.customType === 'pen-path') {
                        const pathProps = otherObj.customProps;

                        if (pathProps.from.anchor === obj) {
                            // Update path starting point
                            pathProps.from.x = obj.left;
                            pathProps.from.y = obj.top;

                            // Update path
                            const newPathString = `M ${obj.left} ${obj.top} C ${pathProps.handle1.left} ${pathProps.handle1.top}, ${pathProps.handle2.left} ${pathProps.handle2.top}, ${pathProps.to.x} ${pathProps.to.y}`;
                            const updated = new fabric.Path(newPathString);
                            otherObj.path = updated.path;

                            // Update direction line
                            pathProps.anchorToHandle1.set({
                                x1: obj.left,
                                y1: obj.top,
                                x2: pathProps.handle1.left,
                                y2: pathProps.handle1.top
                            });
                        }
                        else if (pathProps.to.anchor === obj) {
                            // Update path ending point
                            pathProps.to.x = obj.left;
                            pathProps.to.y = obj.top;

                            // Update path
                            const newPathString = `M ${pathProps.from.x} ${pathProps.from.y} C ${pathProps.handle1.left} ${pathProps.handle1.top}, ${pathProps.handle2.left} ${pathProps.handle2.top}, ${obj.left} ${obj.top}`;
                            const updated = new fabric.Path(newPathString);
                            otherObj.path = updated.path;

                            // Update direction line
                            pathProps.anchorToHandle2.set({
                                x1: obj.left,
                                y1: obj.top,
                                x2: pathProps.handle2.left,
                                y2: pathProps.handle2.top
                            });
                        }
                    }
                });

                canvas.requestRenderAll();
            }
        });

        canvas.on('mouse:down', function (opt) {
            const target = opt.target;
            const canvas = fabricRef.current;

            if (target && target.customType === 'pen-line') {
                saveState();

                // First check if this line already has a path
                if (target.hasPath) {
                    // If it has a path, just select it and show controls
                    const existingPath = canvas.getObjects().find(obj =>
                        obj.customType === 'pen-path' &&
                        obj.customProps.from.x === target.customProps.from.x &&
                        obj.customProps.from.y === target.customProps.from.y &&
                        obj.customProps.to.x === target.customProps.to.x &&
                        obj.customProps.to.y === target.customProps.to.y
                    );

                    if (existingPath) {
                        // Clear any existing controls first
                        clearAllBezierControls();

                        // Get the existing path's properties
                        const props = existingPath.customProps;

                        // Make sure anchors are visible
                        if (props.from.anchor) props.from.anchor.set({ visible: true });
                        if (props.to.anchor) props.to.anchor.set({ visible: true });

                        // Re-add all elements to canvas
                        canvas.add(props.handle1, props.handle2,
                            props.anchorToHandle1, props.anchorToHandle2);
                        canvas.bringToFront(props.handle1);
                        canvas.bringToFront(props.handle2);

                        // Store references
                        diamondGroupRefs.current = [
                            { diamond: props.handle1, line: props.anchorToHandle1 },
                            { diamond: props.handle2, line: props.anchorToHandle2 }
                        ];

                        return;
                    }
                }

                // If no existing path, create new one
                target.hasPath = true;
                clearAllBezierControls();

                const { from, to } = target.customProps;
                canvas.remove(target);

                const startAnchor = drawAnchor(from);
                const endAnchor = drawAnchor(to);
                from.anchor = startAnchor;
                to.anchor = endAnchor;

                const quarterX = from.x + (to.x - from.x) * 0.25;
                const quarterY = from.y + (to.y - from.y) * 0.25;
                const threeQuarterX = from.x + (to.x - from.x) * 0.75;
                const threeQuarterY = from.y + (to.y - from.y) * 0.75;

                const diamond1 = new fabric.Rect({
                    left: quarterX,
                    top: quarterY,
                    width: 9,
                    height: 9,
                    fill: '#fff',
                    stroke: 'gray',
                    strokeWidth: 1,
                    originX: 'center',
                    originY: 'center',
                    angle: 45,
                    rx: 2,
                    ry: 2,
                    selectable: true,
                    evented: true,
                    hasControls: false,
                    hasBorders: false,
                    customType: 'bezier-handle',
                    handleIndex: 1
                });

                const diamond2 = new fabric.Rect({
                    left: threeQuarterX,
                    top: threeQuarterY,
                    width: 9,
                    height: 9,
                    fill: '#fff',
                    stroke: 'gray',
                    strokeWidth: 1,
                    originX: 'center',
                    originY: 'center',
                    angle: 45,
                    rx: 2,
                    ry: 2,
                    selectable: true,
                    evented: true,
                    hasControls: false,
                    hasBorders: false,
                    customType: 'bezier-handle',
                    handleIndex: 2
                });

                const line1 = new fabric.Line(
                    [from.x, from.y, quarterX, quarterY],
                    {
                        stroke: '#94a3b8',
                        strokeWidth: 1,
                        selectable: false,
                        evented: false,
                        customType: 'handleLine'
                    }
                );

                const line2 = new fabric.Line(
                    [to.x, to.y, threeQuarterX, threeQuarterY],
                    {
                        stroke: '#94a3b8',
                        strokeWidth: 1,
                        selectable: false,
                        evented: false,
                        customType: 'handleLine'
                    }
                );

                const bezierPath = new fabric.Path(
                    `M ${from.x} ${from.y} C ${quarterX} ${quarterY}, ${threeQuarterX} ${threeQuarterY}, ${to.x} ${to.y}`,
                    {
                        stroke: '#4BA0FF',
                        fill: '',
                        strokeWidth: 1,
                        selectable: true,
                        hasControls: false,
                        hasBorders: false,
                        evented: true,
                        customType: 'pen-path'
                    }
                );

                bezierPath.customProps = {
                    from: { x: from.x, y: from.y, anchor: startAnchor },
                    to: { x: to.x, y: to.y, anchor: endAnchor },
                    handle1: diamond1,
                    handle2: diamond2,
                    anchorToHandle1: line1,
                    anchorToHandle2: line2,
                    path: bezierPath
                };

                diamond1.associatedPath = bezierPath;
                diamond2.associatedPath = bezierPath;

                canvas.add(diamond1, diamond2, line1, line2, bezierPath);
                canvas.bringToFront(diamond1);
                canvas.bringToFront(diamond2);

                diamondGroupRefs.current.push({ diamond: diamond1, line: line1 });
                diamondGroupRefs.current.push({ diamond: diamond2, line: line2 });
            }
        });

        canvas.on('mouse:down', handleMouseDown);
        canvas.on('mouse:move', handleMouseMove);
        canvas.on('mouse:dblclick', handleDoubleClick);

        return () => canvas.dispose();
    }, []);

    // const drawAnchor = (point) => {
    //     const canvas = fabricRef.current;
    //     const anchor = new fabric.Circle({
    //         left: point.x,
    //         top: point.y,
    //         radius: 5,
    //         fill: '#fff',
    //         stroke: '#3b82f6',
    //         strokeWidth: 1,
    //         originX: 'center',
    //         originY: 'center',
    //         selectable: true,
    //         hasBorders: false,
    //         hasControls: false,
    //         customType: 'anchor',
    //     });
    //     canvas.add(anchor);
    //     canvas.bringToFront(anchor);
    //     return anchor;
    // };

    const activatePenTool = () => {
        const canvas = fabricRef.current;

        // Clear any existing temporary elements
        if (tempGrayLineRef.current) {
            canvas.remove(tempGrayLineRef.current);
            tempGrayLineRef.current = null;
        }
        if (lastDrawnLineRef.current) {
            canvas.remove(lastDrawnLineRef.current);
            lastDrawnLineRef.current = null;
        }

        // Clear all diamond handles and anchors when activating pen tool
        // canvas.getObjects().forEach(obj => {
        //     if (obj.customType === 'diamond' ||
        //         obj.customType === 'bezier-handle' ||
        //         obj.customType === 'handleLine' ||
        //         obj.customType === 'anchor') {
        //         canvas.remove(obj);
        //     }
        // });
        // diamondGroupRefs.current = [];

        isPenToolActiveRef.current = true;
        isDrawingRef.current = false;
        points.current = [];
        wasDoubleClickRef.current = false; // ✅ Allow drawing again

        canvas.selection = false;
        canvas.skipTargetFind = true;

        canvas.forEachObject(obj => {
            obj.selectable = false;
        });
    };

    const saveState = () => {
        const canvas = fabricRef.current;
        if (!canvas) return;

        const json = canvas.toDatalessJSON(['customType', 'customProps', 'associatedPath']);
        undoStack.current.push(json);
        redoStack.current = []; // clear redo stack when new action is done
    };

    const undo = () => {
        const canvas = fabricRef.current;
        if (undoStack.current.length === 0) return;

        const currentState = canvas.toDatalessJSON(['customType', 'customProps', 'associatedPath']);
        redoStack.current.push(currentState);

        const prevState = undoStack.current.pop();
        canvas.loadFromJSON(prevState, () => {
            canvas.renderAll();
        });
    };

    const redo = () => {
        const canvas = fabricRef.current;
        if (redoStack.current.length === 0) return;

        const currentState = canvas.toDatalessJSON(['customType', 'customProps', 'associatedPath']);
        undoStack.current.push(currentState);

        const nextState = redoStack.current.pop();
        canvas.loadFromJSON(nextState, () => {
            canvas.renderAll();
        });
    };

    const addSquare = () => {
        saveState();
        const square = new fabric.Rect({ left: 190, top: 140, width: 100, height: 100, fill: "black", });
        fabricRef.current.add(square);
    };

    const addRectangle = () => {
        saveState();
        const rect = new fabric.Rect({ left: 190, top: 140, width: 120, height: 80, rx: 6, ry: 6, fill: "black", });
        fabricRef.current.add(rect);
    };

    const addTriangle = () => {
        saveState();
        const triangle = new fabric.Triangle({ left: 190, top: 140, width: 100, height: 100, fill: "black", });
        fabricRef.current.add(triangle);
    };

    const addCircle = () => {
        saveState();
        const circle = new fabric.Circle({ left: 190, top: 140, width: 150, height: 150, radius: 50, fill: "black", });
        fabricRef.current.add(circle);
    };

    const addLine = () => {
        saveState();
        const line = new fabric.Line([500, 100, 650, 100], { left: 190, top: 140, stroke: 'black', strokeWidth: 2, });
        fabricRef.current.add(line);
    };

    const addPentagon = () => {
        saveState();
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
        saveState();
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
        saveState();
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
        saveState();
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
        saveState();
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
        saveState();
        const text = new fabric.IText("Edit me", { left: 190, top: 140, fontSize: 24, fill: "black", });
        fabricRef.current.add(text);
    };

    const handleFileChange = (e) => {
        saveState();
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
        saveState();
        fileInputRef.current.click();
    };

    const changeColor = (newColor) => {
        saveState();
        const activeObject = fabricRef.current.getActiveObject();
        if (activeObject && activeObject.set) {
            if (activeObject.type === "line" || activeObject.type === "path") {
                activeObject.set("stroke", newColor);
            } else {
                activeObject.set("fill", newColor);
            }
            fabricRef.current.renderAll();
        }
    };

    const handleSelection = (e) => {
        const obj = e.selected[0];
        setSelectedObject(obj);

        // Show toolbar only if it's the bezier group
        if (obj?.type === 'group' && obj?.customProps) {
            const bound = obj.getBoundingRect();
            const canvasEl = canvasRef.current.getBoundingClientRect();

            const toolbarX = canvasEl.left + bound.left + bound.width / 2;
            const toolbarY = canvasEl.top + bound.top - 10;

            setToolbarPos({ x: toolbarX, y: toolbarY });
        } else {
            // Hide toolbar if not group
            setToolbarPos(null);
        }
    };

    const duplicateObject = () => {
        saveState();
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
        saveState();
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

    const deleteSelected = () => {
        saveState();
        const canvas = fabricRef.current;
        const activeObject = canvas.getActiveObject();

        if (activeObject) {
            // If it's a bezier path with customProps, delete related items too
            if (activeObject.type === 'path' && activeObject.customProps) {
                const {
                    from,
                    to,
                    handle1,
                    handle2,
                    directionLine,
                    anchorToHandle1,
                    anchorToHandle2
                } = activeObject.customProps;

                // Remove all associated elements from canvas
                [
                    from.anchor,
                    to.anchor,
                    handle1,
                    handle2,
                    directionLine,
                    anchorToHandle1,
                    anchorToHandle2,
                    activeObject // finally remove the path itself
                ].forEach(obj => {
                    if (obj) canvas.remove(obj);
                });
            } else {
                // For regular objects, just remove the selected object
                canvas.remove(activeObject);
            }

            groupItems.current.forEach(obj => {
                if (obj && canvas.contains(obj)) canvas.remove(obj);
            });
            groupItems.current = [];

            setToolbarPos(null);
            setSelectedObject(null);
            canvas.discardActiveObject().requestRenderAll();
        }
    };

    return (
        <>
            <div className="flex items-center relative">
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
                    onUndo={undo}
                    onRedo={redo}
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
                    <div
                        style={{
                            position: 'absolute',
                            left: toolbarPos.x,
                            top: toolbarPos.y,
                            transform: 'translate(-50%, -100%)',
                            zIndex: 1000
                        }}
                    >
                        <ShapeToolbar
                            position={toolbarPos}
                            onDuplicate={() => duplicateObject()}
                            onDelete={() => deleteSelected()}
                        />
                    </div>
                )}
            </div>
        </>
    )
}

export default CanvasEditor