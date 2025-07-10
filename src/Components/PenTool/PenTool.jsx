import React, { useEffect, useRef } from 'react';
import { fabric } from 'fabric';

function PenTool() {
    const canvasRef = useRef(null);
    const fabricCanvasRef = useRef(null);
    const isDrawingRef = useRef(false);
    const points = useRef([]);
    const groupItems = useRef([]);
    const tempGrayLineRef = useRef(null);

    useEffect(() => {
        const canvas = new fabric.Canvas(canvasRef.current, {
            width: 800,
            height: 600,
            backgroundColor: '#ffffff',
            selection: false,
        });

        fabricCanvasRef.current = canvas;

        const handleMouseDown = (opt) => {
            const pointer = canvas.getPointer(opt.e);
            const point = { x: pointer.x, y: pointer.y };
            drawAnchor(point);

            if (!isDrawingRef.current) {
                isDrawingRef.current = true;
                points.current = [point];
            } else {
                const lastPoint = points.current[points.current.length - 1];

                // Remove temp preview gray line
                if (tempGrayLineRef.current) {
                    canvas.remove(tempGrayLineRef.current);
                    tempGrayLineRef.current = null;
                }

                drawBlueLine(lastPoint, point);
                drawDirectionHandle(lastPoint, point);

                points.current.push(point);
            }
        };

        const handleMouseMove = (opt) => {
            if (!isDrawingRef.current || points.current.length === 0) return;

            const canvas = fabricCanvasRef.current;
            const pointer = canvas.getPointer(opt.e);
            const lastPoint = points.current[points.current.length - 1];

            // Remove old temp line
            if (tempGrayLineRef.current) {
                canvas.remove(tempGrayLineRef.current);
            }

            // Create updated temp preview line
            const tempLine = new fabric.Line([lastPoint.x, lastPoint.y, pointer.x, pointer.y], {
                stroke: '#94a3b8',
                strokeWidth: 1,
                selectable: false,
                evented: false,
            });

            canvas.add(tempLine);
            canvas.bringToFront(tempLine);
            tempGrayLineRef.current = tempLine;
        };

        const handleDoubleClick = () => {
            if (tempGrayLineRef.current) {
                canvas.remove(tempGrayLineRef.current);
                tempGrayLineRef.current = null;
            }

            if (groupItems.current.length > 0) {
                const group = new fabric.Group(groupItems.current, {
                    selectable: true,
                    evented: true,
                });

                canvas.add(group);
                canvas.bringToFront(group);
                groupItems.current = [];
            }

            isDrawingRef.current = false;
            points.current = [];
        };

        canvas.on('mouse:down', handleMouseDown);
        canvas.on('mouse:move', handleMouseMove);
        canvas.on('mouse:dblclick', handleDoubleClick);

        return () => {
            canvas.off('mouse:down', handleMouseDown);
            canvas.off('mouse:move', handleMouseMove);
            canvas.off('mouse:dblclick', handleDoubleClick);
            canvas.dispose();
        };
    }, []);

    const drawAnchor = (point) => {
        const canvas = fabricCanvasRef.current;
        const anchor = new fabric.Circle({
            left: point.x,
            top: point.y,
            radius: 5,
            fill: '#ffffff',
            stroke: '#3b82f6',
            strokeWidth: 2,
            originX: 'center',
            originY: 'center',
            selectable: true,
            hasBorders: false,
            hasControls: false,
        });

        canvas.add(anchor);
        canvas.bringToFront(anchor);
        groupItems.current.push(anchor);
    };

    const drawDirectionHandle = (from, to) => {
        const canvas = fabricCanvasRef.current;

        // Vector from 'from' to 'to'
        const dx = to.x - from.x;
        const dy = to.y - from.y;

        // Total length of segment
        const len = Math.sqrt(dx * dx + dy * dy);

        // Normalize direction
        const ux = dx / len;
        const uy = dy / len;

        // Offset from each end for handle placement (e.g., 25% from both ends)
        const offset = len * 0.25;

        // First handle point (from -> offset)
        const x1 = from.x + ux * offset;
        const y1 = from.y + uy * offset;

        // Second handle point (to -> offset)
        const x2 = to.x - ux * offset;
        const y2 = to.y - uy * offset;

        // Full gray direction line from from to to
        const directionLine = new fabric.Line([from.x, from.y, to.x, to.y], {
            stroke: '#94a3b8',
            strokeWidth: 1,
            selectable: false,
            evented: false,
        });

        // First diamond
        const handle1 = new fabric.Rect({
            left: x1,
            top: y1,
            width: 8,
            height: 8,
            fill: '#ffffff',
            stroke: '#94a3b8',
            strokeWidth: 1,
            angle: 45,
            originX: 'center',
            originY: 'center',
            selectable: false,
            hasControls: false,
        });

        // Second diamond
        const handle2 = new fabric.Rect({
            left: x2,
            top: y2,
            width: 8,
            height: 8,
            fill: '#ffffff',
            stroke: '#94a3b8',
            strokeWidth: 1,
            angle: 45,
            originX: 'center',
            originY: 'center',
            selectable: false,
            hasControls: false,
        });

        canvas.add(directionLine);
        canvas.add(handle1);
        canvas.add(handle2);

        canvas.bringToFront(handle1);
        canvas.bringToFront(handle2);

        groupItems.current.push(directionLine, handle1, handle2);
    };

    const drawBlueLine = (from, to) => {
        const canvas = fabricCanvasRef.current;

        const blueLine = new fabric.Line([from.x, from.y, to.x, to.y], {
            stroke: '#60a5fa',
            strokeWidth: 1,
            selectable: false,
            evented: false,
        });

        canvas.add(blueLine);
        groupItems.current.push(blueLine);
    };

    return (
        <>
            <div className="flex items-center justify-center h-screen bg-gray-100">
                <canvas
                    ref={canvasRef}
                    className="border border-gray-300 rounded-md shadow-md"
                />
            </div>
        </>
    )
}

export default PenTool