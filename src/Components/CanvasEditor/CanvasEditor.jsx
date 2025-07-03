import React, { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';
import Sidebar from '../Sidebar/Sidebar';
import ShapeToolbar from '../ShapeToolbar/ShapeToolbar';

function CanvasEditor() {

    const canvasRef = useRef(null);
    const fabricRef = useRef(null);
    const fileInputRef = useRef(null);

    const [toolbarPos, setToolbarPos] = useState(null);
    const [selectedObject, setSelectedObject] = useState(null);

    const penToolActive = useRef(false);
    const penPoints = useRef([]);
    const currentPath = useRef(null);
    const livePreviewLine = useRef(null);

    useEffect(() => {
        const canvas = new fabric.Canvas(canvasRef.current, {
            width: 500,
            height: 500,
            backgroundColor: "#fff",
        });
        fabricRef.current = canvas;

        const handleSelection = (e) => {
            if (e.selected && e.selected.length > 0) {
                updateToolbar(e.selected[0]);
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
        });
        canvas.on('object:moving', handleMove);

        // Pen tool event handlers
        canvas.on('mouse:down', (opt) => {
            if (!penToolActive.current) return;

            const pointer = canvas.getPointer(opt.e, true);
            const { x, y } = pointer;

            if (livePreviewLine.current) {
                canvas.remove(livePreviewLine.current);
                livePreviewLine.current = null;
            }

            if (opt.e.detail === 2) {
                penToolActive.current = false;
                penPoints.current = [];
                if (currentPath.current) {
                    currentPath.current.set({ selectable: true });
                    canvas.renderAll();
                }
                return;
            }

            penPoints.current.push({ x, y });

            const pathStr = penPoints.current.reduce((acc, point, index) => {
                const cmd = index === 0 ? 'M' : 'L';
                return acc + ` ${cmd} ${point.x} ${point.y}`;
            }, '');

            if (!currentPath.current) {
                const path = new fabric.Path(pathStr, {
                    stroke: 'black',
                    strokeWidth: 2,
                    fill: null,
                    selectable: false,
                    evented: false,
                });
                canvas.add(path);
                currentPath.current = path;
            } else {
                canvas.remove(currentPath.current);
                const path = new fabric.Path(pathStr, {
                    stroke: 'black',
                    strokeWidth: 2,
                    fill: null,
                    selectable: false,
                    evented: false,
                });
                canvas.add(path);
                currentPath.current = path;
            }
            canvas.renderAll();
        });

        canvas.on('mouse:move', (opt) => {
            if (!penToolActive.current || penPoints.current.length === 0) return;

            const pointer = canvas.getPointer(opt.e, true);
            const lastPoint = penPoints.current[penPoints.current.length - 1];

            if (!lastPoint) return;

            if (livePreviewLine.current) {
                canvas.remove(livePreviewLine.current);
            }

            const tempLine = new fabric.Line([lastPoint.x, lastPoint.y, pointer.x, pointer.y], {
                stroke: 'blue',
                strokeWidth: 1,
                selectable: false,
                evented: false,
                strokeDashArray: [5, 5],
            });

            livePreviewLine.current = tempLine;
            canvas.add(tempLine);
            canvas.renderAll();
        });

        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                penToolActive.current = false;
                penPoints.current = [];
                if (currentPath.current) {
                    currentPath.current.set({ selectable: true });
                    currentPath.current = null;
                    canvas.renderAll();
                }
            }
        });

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
        penToolActive.current = true;
        penPoints.current = [];
        currentPath.current = null;
        fabricRef.current.discardActiveObject();
        fabricRef.current.renderAll();
    };

    const addSquare = () => {
        const square = new fabric.Rect({
            left: 290,
            top: 140,
            width: 100,
            height: 100,
            fill: "black",
        });
        fabricRef.current.add(square);
    };

    const addRectangle = () => {
        const rect = new fabric.Rect({
            left: 290,
            top: 140,
            width: 120,
            height: 80,
            rx: 6,
            ry: 6,
            fill: "black",
        });
        fabricRef.current.add(rect);
    };

    const addTriangle = () => {
        const triangle = new fabric.Triangle({
            left: 290,
            top: 140,
            width: 100,
            height: 100,
            fill: "black",
        });
        fabricRef.current.add(triangle);
    };

    const addCircle = () => {
        const circle = new fabric.Circle({
            left: 290,
            top: 140,
            width: 150,
            height: 150,
            radius: 50,
            fill: "black",
        });
        fabricRef.current.add(circle);
    };

    const addLine = () => {
        const line = new fabric.Line([500, 100, 650, 100], {
            left: 290,
            top: 140,
            stroke: 'black',
            strokeWidth: 2,
        });
        fabricRef.current.add(line);
    };

    const addText = () => {
        const text = new fabric.IText("Edit me", {
            left: 290,
            top: 140,
            fontSize: 24,
            fill: "black",
        });
        fabricRef.current.add(text);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (f) => {
            fabric.Image.fromURL(f.target.result, (img) => {
                img.set({
                    left: 290,
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
        const activeObject = fabricRef.current.getActiveObject();
        if (activeObject) {
            fabricRef.current.remove(activeObject);
            setToolbarPos(null);
        }
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
            <div className="flex">
                <Sidebar
                    onAddSquare={addSquare}
                    onAddRectangle={addRectangle}
                    onAddTriangle={addTriangle}
                    onAddCircle={addCircle}
                    onAddLine={addLine}
                    onAddText={addText}
                    onUploadImage={uploadImage}
                    onDelete={deleteSelected}
                    onChangeColor={changeColor}
                    onChangeSize={changeSize}
                    onActivatePenTool={activatePenTool}
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