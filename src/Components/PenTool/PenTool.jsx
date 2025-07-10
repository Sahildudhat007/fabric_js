import React, { useEffect, useRef } from 'react';
import { fabric } from 'fabric';

function PenTool() {
    const canvasRef = useRef(null);
    const fabricCanvasRef = useRef(null);
    const isDrawingRef = useRef(false);
    const points = useRef([]);
    const groupItems = useRef([]);
    const tempGrayLineRef = useRef(null);
    const currentPathRef = useRef(null);
    const pathSegments = useRef([]);

    useEffect(() => {
        const canvas = new fabric.Canvas(canvasRef.current, {
            width: 800,
            height: 600,
            backgroundColor: '#ffffff',
            selection: false,
        });

        fabricCanvasRef.current = canvas;

        const handleMouseDown = (opt) => {
            const canvas = fabricCanvasRef.current;
            const target = opt.target;

            // If clicked object is a diamond handle, don't add a new point
            if (target && target.type === 'rect' && target.angle === 45) return;

            const pointer = canvas.getPointer(opt.e);
            const point = { x: pointer.x, y: pointer.y };

            if (!isDrawingRef.current) {
                // Start new path
                isDrawingRef.current = true;
                const anchor = drawAnchor(point);
                points.current = [{ ...point, anchor }];
                pathSegments.current = [];
            } else {
                // Add new point to existing path
                const lastPoint = points.current[points.current.length - 1];

                // Remove temp preview gray line
                if (tempGrayLineRef.current) {
                    canvas.remove(tempGrayLineRef.current);
                    tempGrayLineRef.current = null;
                }

                // Add new anchor point
                const anchor = drawAnchor(point);
                const current = { ...point, anchor };

                // Create curve segment
                const segment = drawBezierCurve(lastPoint, current);
                pathSegments.current.push(segment);
                points.current.push(current);
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
            const canvas = fabricCanvasRef.current;

            if (tempGrayLineRef.current) {
                canvas.remove(tempGrayLineRef.current);
                tempGrayLineRef.current = null;
            }

            // Remove only gray direction lines from canvas & groupItems
            groupItems.current = groupItems.current.filter((item) => {
                const isDirectionLine = item.type === 'line' && item.stroke === '#94a3b8';

                if (isDirectionLine) {
                    canvas.remove(item);
                    return false; // Don't keep this in groupItems
                }

                return true; // Keep other items (handles, anchors, paths)
            });

            if (groupItems.current.length > 0) {
                const group = new fabric.Group(groupItems.current, {
                    selectable: true,
                    evented: true,
                });

                canvas.add(group);
                canvas.bringToFront(group);
                groupItems.current = [];
                currentPathRef.current = null;
            }

            isDrawingRef.current = false;
            points.current = [];
        };

        const updatePath = (handle) => {
            // Find which segment this handle belongs to
            const segment = pathSegments.current.find(seg =>
                seg.customProps.handle1 === handle || seg.customProps.handle2 === handle
            );

            if (!segment) return;

            const {
                from,
                to,
                handle1,
                handle2,
                anchorToHandle1,
                anchorToHandle2,
                directionLine
            } = segment.customProps;


            // Get updated control points
            const cx1 = handle1.left;
            const cy1 = handle1.top;
            const cx2 = handle2.left;
            const cy2 = handle2.top;

            // Rebuild the path string
            const newPath = `M ${from.x} ${from.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${to.x} ${to.y}`;

            // Update the path
            segment.set({ path: new fabric.Path(newPath).path });

            // Update the direction line
            directionLine.set({
                x1: from.x,
                y1: from.y,
                x2: to.x,
                y2: to.y,
            });

            // Update anchor-to-handle lines
            anchorToHandle1.set({
                x1: from.anchor.left,
                y1: from.anchor.top,
                x2: handle1.left,
                y2: handle1.top,
            });
            anchorToHandle2.set({
                x1: to.anchor.left,
                y1: to.anchor.top,
                x2: handle2.left,
                y2: handle2.top,
            });

            fabricCanvasRef.current.requestRenderAll();
        };

        canvas.on('object:moving', (opt) => {
            const obj = opt.target;
            if (obj.type === 'rect' && obj.angle === 45) {
                updatePath(obj);
            }
        });

        canvas.on('mouse:down', handleMouseDown);
        canvas.on('mouse:move', handleMouseMove);
        canvas.on('mouse:dblclick', handleDoubleClick);

        return () => {
            canvas.off('mouse:down', handleMouseDown);
            canvas.off('mouse:move', handleMouseMove);
            canvas.off('mouse:dblclick', handleDoubleClick);
            canvas.off('object:moving');
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

        return anchor; // return the anchor
    };

    const drawBezierCurve = (from, to) => {
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
        const cx1 = from.x + ux * offset;
        const cy1 = from.y + uy * offset;

        // Second handle point (to -> offset)
        const cx2 = to.x - ux * offset;
        const cy2 = to.y - uy * offset;

        // Draw Bézier path
        const pathStr = `M ${from.x} ${from.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${to.x} ${to.y}`;

        const bezier = new fabric.Path(pathStr, {
            stroke: '#60a5fa',
            strokeWidth: 1,
            fill: '',
            selectable: false,
            evented: false,
            objectCaching: false,
        });

        // First diamond
        const handle1 = new fabric.Rect({
            left: cx1,
            top: cy1,
            width: 8,
            height: 8,
            fill: '#ffffff',
            stroke: '#94a3b8',
            strokeWidth: 1,
            angle: 45,
            originX: 'center',
            originY: 'center',
            selectable: true,
            hasControls: false,
            objectCaching: false,
        });

        // Second diamond
        const handle2 = new fabric.Rect({
            left: cx2,
            top: cy2,
            width: 8,
            height: 8,
            fill: '#ffffff',
            stroke: '#94a3b8',
            strokeWidth: 1,
            angle: 45,
            originX: 'center',
            originY: 'center',
            selectable: true,
            hasControls: false,
            objectCaching: false,
        });

        // Full gray direction line from from to to
        const directionLine = new fabric.Line([from.x, from.y, to.x, to.y], {
            stroke: '#94a3b8',
            strokeWidth: 1,
            selectable: false,
            evented: false,
        });

        // Add anchor-to-handle gray lines
        const anchorToHandle1 = new fabric.Line([from.anchor.left, from.anchor.top, cx1, cy1], {
            stroke: '#94a3b8',
            strokeWidth: 1,
            selectable: false,
            evented: false,
        });

        const anchorToHandle2 = new fabric.Line([to.anchor.left, to.anchor.top, cx2, cy2], {
            stroke: '#94a3b8',
            strokeWidth: 1,
            selectable: false,
            evented: false,
        });

        // Store references
        bezier.customProps = {
            from,
            to,
            handle1,
            handle2,
            directionLine,
            anchorToHandle1,
            anchorToHandle2,
        };

        canvas.add(bezier, directionLine, handle1, handle2, anchorToHandle1, anchorToHandle2);
        canvas.bringToFront(handle1);
        canvas.bringToFront(handle2);

        groupItems.current.push(bezier, directionLine, handle1, handle2, anchorToHandle1, anchorToHandle2);
        currentPathRef.current = bezier;

        return bezier;
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