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
    const currentPathRef = useRef(null);
    const pathSegments = useRef([]);

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

            // If Pen Tool is active, continue drawing
            if (isPenToolActiveRef.current) {
                const pointer = canvas.getPointer(opt.e);
                const point = { x: pointer.x, y: pointer.y };

                if (!isDrawingRef.current) {
                    isDrawingRef.current = true;
                    const anchor = drawAnchor(point);
                    points.current = [{ ...point, anchor }];
                    pathSegments.current = [];
                } else {
                    const lastPoint = points.current[points.current.length - 1];

                    if (tempGrayLineRef.current) {
                        canvas.remove(tempGrayLineRef.current);
                        tempGrayLineRef.current = null;
                    }

                    const anchor = drawAnchor(point);
                    const current = { ...point, anchor };
                    const segment = drawBezierCurve(lastPoint, current);
                    pathSegments.current.push(segment);
                    points.current.push(current);
                }
            }
            // If Pen Tool is NOT active, allow selecting Bézier paths by left-click
            else if (opt.target?.type === 'path' && opt.target?.customProps) {
                fabricRef.current.setActiveObject(opt.target); // Let Fabric handle selection
            }
        };

        const handleMouseMove = (opt) => {
            if (!isDrawingRef.current || points.current.length === 0) return;
            const pointer = canvas.getPointer(opt.e);
            const lastPoint = points.current[points.current.length - 1];

            if (tempGrayLineRef.current) canvas.remove(tempGrayLineRef.current);

            const tempLine = new fabric.Line([lastPoint.x, lastPoint.y, pointer.x, pointer.y], {
                stroke: '#94a3b8', strokeWidth: 1, selectable: false, evented: false
            });
            canvas.add(tempLine);
            canvas.bringToFront(tempLine);
            tempGrayLineRef.current = tempLine;
        };

        const handleDoubleClick = () => {
            const canvas = fabricRef.current;

            // Remove temp preview line
            if (tempGrayLineRef.current) {
                canvas.remove(tempGrayLineRef.current);
                tempGrayLineRef.current = null;
            }

            // Remove gray direction lines
            pathSegments.current.forEach(segment => {
                const { directionLine } = segment.customProps;
                if (directionLine) canvas.remove(directionLine);
            });

            const first = points.current[0];
            const last = points.current[points.current.length - 1];
            const isClosed = Math.abs(first.x - last.x) < 5 && Math.abs(first.y - last.y) < 5;

            if (points.current.length > 1) {
                let pathStr = `M ${points.current[0].x} ${points.current[0].y}`;
                for (let i = 1; i < points.current.length; i++) {
                    const from = points.current[i - 1];
                    const to = points.current[i];

                    const dx = to.x - from.x, dy = to.y - from.y;
                    const len = Math.sqrt(dx * dx + dy * dy);
                    const ux = dx / len, uy = dy / len;
                    const offset = len * 0.25;
                    const cx1 = from.x + ux * offset, cy1 = from.y + uy * offset;
                    const cx2 = to.x - ux * offset, cy2 = to.y - uy * offset;

                    pathStr += ` C ${cx1} ${cy1}, ${cx2} ${cy2}, ${to.x} ${to.y}`;
                }

                if (isClosed) {
                    pathStr += ' Z';
                }

                const filledPath = new fabric.Path(pathStr, {
                    fill: isClosed ? '#fcd34d' : '',
                    stroke: 'transparent', // we already have stroke from segments
                    selectable: false,
                    evented: false
                });

                canvas.add(filledPath);
                canvas.sendToBack(filledPath); // keep it behind anchors/handles
            }

            // Store the final anchor in last segment’s customProps.to
            if (points.current.length > 0) {
                const lastPoint = points.current[points.current.length - 1];
                if (lastPoint.anchor) {
                    groupItems.current.push(lastPoint.anchor); // Add final anchor to group
                }
            }

            // After drawing: enable selection for path group only
            canvas.selection = true;
            canvas.skipTargetFind = false;

            // Enable selection again
            canvas.forEachObject(obj => {
                if (obj.type === 'path' && obj.customProps) {
                    obj.selectable = true;
                } else {
                    obj.selectable = true; // enable normal shape selection if needed
                }
            });

            isDrawingRef.current = false;
            isPenToolActiveRef.current = false;
            currentPathRef.current = null;
            points.current = [];
        };

        canvas.on("selection:created", handleSelection);
        canvas.on("selection:updated", handleSelection);
        canvas.on("selection:cleared", () => {
            setToolbarPos(null);
            setSelectedObject(null);
        });

        canvas.on('object:moving', (opt) => {
            const obj = opt.target;

            // Move Bézier handles and keep curve updated
            if (obj.customType === 'bezier-handle') {
                const path = obj.associatedPath;
                const customProps = path.customProps;
                const anchor = obj.isHandle1 ? customProps.from.anchor : customProps.to.anchor;

                // Update the path string
                const newPath = `M ${customProps.from.x} ${customProps.from.y} C ${customProps.handle1.left} ${customProps.handle1.top}, ${customProps.handle2.left} ${customProps.handle2.top}, ${customProps.to.x} ${customProps.to.y}`;
                path.set({ path: new fabric.Path(newPath).path });

                // Update handle line
                const line = obj.isHandle1 ? customProps.anchorToHandle1 : customProps.anchorToHandle2;
                line.set({
                    x1: anchor.left,
                    y1: anchor.top,
                    x2: obj.left,
                    y2: obj.top
                });

                // Update direction line
                customProps.directionLine.set({
                    x1: customProps.from.x,
                    y1: customProps.from.y,
                    x2: customProps.to.x,
                    y2: customProps.to.y
                });

                canvas.requestRenderAll();
            }

            // If moving entire Bézier path
            if (obj.type === 'path' && obj.customProps) {
                const deltaX = obj.left - (obj._prevLeft ?? obj.left);
                const deltaY = obj.top - (obj._prevTop ?? obj.top);

                obj._prevLeft = obj.left;
                obj._prevTop = obj.top;

                const {
                    from,
                    to,
                    handle1,
                    handle2,
                    directionLine,
                    anchorToHandle1,
                    anchorToHandle2
                } = obj.customProps;

                const moveObj = (o) => {
                    o.left += deltaX;
                    o.top += deltaY;
                    o.setCoords();
                };

                moveObj(from.anchor);
                moveObj(to.anchor);
                moveObj(handle1);
                moveObj(handle2);

                directionLine.set({
                    x1: directionLine.x1 + deltaX,
                    y1: directionLine.y1 + deltaY,
                    x2: directionLine.x2 + deltaX,
                    y2: directionLine.y2 + deltaY
                });

                anchorToHandle1.set({
                    x1: anchorToHandle1.x1 + deltaX,
                    y1: anchorToHandle1.y1 + deltaY,
                    x2: anchorToHandle1.x2 + deltaX,
                    y2: anchorToHandle1.y2 + deltaY
                });

                anchorToHandle2.set({
                    x1: anchorToHandle2.x1 + deltaX,
                    y1: anchorToHandle2.y1 + deltaY,
                    x2: anchorToHandle2.x2 + deltaX,
                    y2: anchorToHandle2.y2 + deltaY
                });

                // Update point positions
                from.x += deltaX;
                from.y += deltaY;
                to.x += deltaX;
                to.y += deltaY;

                // Rebuild path
                const pathStr = `M ${from.x} ${from.y} C ${handle1.left} ${handle1.top}, ${handle2.left} ${handle2.top}, ${to.x} ${to.y}`;
                obj.set({
                    path: new fabric.Path(pathStr).path,
                    left: 0,
                    top: 0,
                    selectable: true
                });

                obj.setCoords();
                canvas.requestRenderAll();
            }
        });

        canvas.on('mouse:down', handleMouseDown);
        canvas.on('mouse:move', handleMouseMove);
        canvas.on('mouse:dblclick', handleDoubleClick);

        return () => canvas.dispose();
    }, []);

    const drawAnchor = (point) => {
        const canvas = fabricRef.current;
        const anchor = new fabric.Circle({
            left: point.x, top: point.y, radius: 5,
            fill: '#fff', stroke: '#3b82f6', strokeWidth: 2,
            originX: 'center', originY: 'center', selectable: true,
            hasBorders: false, hasControls: false
        });
        canvas.add(anchor);
        canvas.bringToFront(anchor);
        groupItems.current.push(anchor);
        return anchor;
    };

    const drawBezierCurve = (from, to) => {
        const canvas = fabricRef.current;
        const dx = to.x - from.x, dy = to.y - from.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        const ux = dx / len, uy = dy / len, offset = len * 0.25;
        const cx1 = from.x + ux * offset, cy1 = from.y + uy * offset;
        const cx2 = to.x - ux * offset, cy2 = to.y - uy * offset;

        const pathStr = `M ${from.x} ${from.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${to.x} ${to.y}`;
        const bezier = new fabric.Path(pathStr, {
            stroke: '#60a5fa',
            strokeWidth: 1,
            fill: '',
            selectable: false,
            evented: true,
            objectCaching: false
        });

        // Create handles with custom properties to identify them
        const handle1 = new fabric.Rect({
            left: cx1,
            top: cy1,
            width: 8,
            height: 8,
            fill: '#fff',
            stroke: '#94a3b8',
            strokeWidth: 1,
            angle: 45,
            originX: 'center',
            originY: 'center',
            selectable: true,
            hasControls: false,
            customType: 'bezier-handle',
            associatedPath: bezier,
            isHandle1: true
        });

        const handle2 = new fabric.Rect({
            left: cx2,
            top: cy2,
            width: 8,
            height: 8,
            fill: '#fff',
            stroke: '#94a3b8',
            strokeWidth: 1,
            angle: 45,
            originX: 'center',
            originY: 'center',
            selectable: true,
            hasControls: false,
            customType: 'bezier-handle',
            associatedPath: bezier,
            isHandle2: true
        });

        const directionLine = new fabric.Line([from.x, from.y, to.x, to.y], {
            stroke: '#94a3b8',
            strokeWidth: 1,
            selectable: false,
            evented: false
        });

        const anchorToHandle1 = new fabric.Line([from.anchor.left, from.anchor.top, cx1, cy1], {
            stroke: '#94a3b8',
            strokeWidth: 1,
            selectable: false,
            evented: false
        });

        const anchorToHandle2 = new fabric.Line([to.anchor.left, to.anchor.top, cx2, cy2], {
            stroke: '#94a3b8',
            strokeWidth: 1,
            selectable: false,
            evented: false
        });

        // Store references to all related objects
        bezier.customProps = {
            from,
            to,
            handle1,
            handle2,
            directionLine,
            anchorToHandle1,
            anchorToHandle2
        };

        // Add all objects to canvas
        canvas.add(bezier, directionLine, handle1, handle2, anchorToHandle1, anchorToHandle2);
        canvas.bringToFront(handle1);
        canvas.bringToFront(handle2);

        // Add to group items
        groupItems.current.push(bezier, directionLine, handle1, handle2, anchorToHandle1, anchorToHandle2);

        // Store the current path
        currentPathRef.current = bezier;

        return bezier;
    };

    const activatePenTool = () => {
        isPenToolActiveRef.current = true;
        isDrawingRef.current = false;
        points.current = [];
        pathSegments.current = [];
        groupItems.current = [];
        currentPathRef.current = null;
        tempGrayLineRef.current = null;

        const canvas = fabricRef.current;

        // Disable drag selection box
        canvas.selection = false;

        // Don't allow object selection while drawing
        canvas.skipTargetFind = true;

        // Disable object selection while drawing
        canvas.forEachObject(obj => {
            obj.selectable = false;
        });
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

    const changeColor = (newColor) => {
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

        // Show toolbar only if it's the blue bezier path
        if (obj?.type === 'path' && obj?.customProps) {
            const bound = obj.getBoundingRect();
            const canvasEl = canvasRef.current.getBoundingClientRect();

            const toolbarX = canvasEl.left + bound.left + bound.width / 2;
            const toolbarY = canvasEl.top + bound.top - 10;

            setToolbarPos({ x: toolbarX, y: toolbarY });
        } else {
            // Hide toolbar if not path
            setToolbarPos(null);
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

    const deleteSelected = () => {
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
                    // onDelete={deleteSelected}
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