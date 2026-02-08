'use client';

import { useRoomContext } from '@livekit/components-react';
import { Pencil, FileText, X, Palette, Trash2, CircleDot } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export default function MeetingOverlay() {
    const [isDrawing, setIsDrawing] = useState(false);
    const [showNotes, setShowNotes] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [color, setColor] = useState('#ef4444');

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const isPainting = useRef(false);
    const lastPos = useRef({ x: 0, y: 0 });

    // Handle canvas resize
    useEffect(() => {
        const handleResize = () => {
            if (canvasRef.current) {
                // Save content
                const ctx = canvasRef.current.getContext('2d');
                if (!ctx) return;
                const data = ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);

                canvasRef.current.width = window.innerWidth;
                canvasRef.current.height = window.innerHeight;

                // Restore content (might be stretched/cropped, but better than loss)
                ctx.putImageData(data, 0, 0);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Initialize canvas when drawing starts
    useEffect(() => {
        if (isDrawing && canvasRef.current) {
            canvasRef.current.width = window.innerWidth;
            canvasRef.current.height = window.innerHeight;
        }
    }, [isDrawing]);

    const startPaint = (e: React.MouseEvent<HTMLCanvasElement>) => {
        isPainting.current = true;
        lastPos.current = { x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY };
    };

    const stopPaint = () => {
        isPainting.current = false;
        // creating a new path prevents connecting lines when re-entering
        const ctx = canvasRef.current?.getContext('2d');
        ctx?.beginPath();
    };

    const paint = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isPainting.current || !canvasRef.current) return;

        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;

        ctx.strokeStyle = color;
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        ctx.moveTo(lastPos.current.x, lastPos.current.y);
        ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
        ctx.stroke();

        lastPos.current = { x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY };
    };

    const clearCanvas = () => {
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx && canvasRef.current) {
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
    };

    return (
        <>
            {/* Floating Toolbar (Left) */}
            <div className="fixed left-4 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-[60]">
                <div className="bg-zinc-900/90 p-2 rounded-xl border border-zinc-800 shadow-xl backdrop-blur-sm flex flex-col gap-2">
                    <button
                        onClick={() => setIsDrawing(!isDrawing)}
                        className={`p-3 rounded-lg transition-all ${isDrawing ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}
                        title="Toggle Whiteboard"
                    >
                        <Pencil size={20} />
                    </button>
                    <button
                        onClick={() => setShowNotes(!showNotes)}
                        className={`p-3 rounded-lg transition-all ${showNotes ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}
                        title="Meeting Notes"
                    >
                        <FileText size={20} />
                    </button>
                    <button
                        onClick={() => setIsRecording(!isRecording)}
                        className={`p-3 rounded-lg transition-all ${isRecording ? 'bg-red-500 text-white shadow-lg shadow-red-500/20 animate-pulse' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}
                        title={isRecording ? "Stop Recording" : "Start Recording"}
                    >
                        <CircleDot size={20} />
                    </button>
                </div>

                {/* Drawing Tools (Only visible when drawing) */}
                {isDrawing && (
                    <div className="bg-zinc-900/90 p-3 rounded-xl border border-zinc-800 shadow-xl backdrop-blur-sm flex flex-col gap-3 animate-in fade-in slide-in-from-left-4 duration-300">
                        <div className="flex flex-col gap-2">
                            {['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#ffffff'].map(c => (
                                <button
                                    key={c}
                                    onClick={() => setColor(c)}
                                    className={`w-6 h-6 rounded-full border-2 transition-transform ${color === c ? 'border-white scale-110' : 'border-transparent hover:scale-110'}`}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                        </div>
                        <div className="w-full h-px bg-zinc-700 my-1"></div>
                        <button
                            onClick={clearCanvas}
                            className="p-2 bg-zinc-800 hover:bg-red-500/20 hover:text-red-500 text-zinc-400 rounded-lg transition-colors flex justify-center"
                            title="Clear Canvas"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                )}
            </div>

            {/* Drawing Canvas Layer */}
            {isDrawing && (
                <canvas
                    ref={canvasRef}
                    className="fixed inset-0 z-[55] cursor-crosshair touch-none"
                    onMouseDown={startPaint}
                    onMouseUp={stopPaint}
                    onMouseMove={paint}
                    onMouseLeave={stopPaint}
                />
            )}

            {/* Notes Panel */}
            {showNotes && (
                <div className="fixed top-4 right-4 bottom-24 w-80 bg-zinc-900/95 border border-zinc-800 z-[60] rounded-2xl shadow-2xl flex flex-col backdrop-blur-md overflow-hidden animate-in slide-in-from-right-10 duration-300">
                    <div className="flex justify-between items-center p-4 border-b border-zinc-800 bg-zinc-900/50">
                        <h3 className="font-medium text-white flex items-center gap-2">
                            <FileText size={16} className="text-blue-500" />
                            Notes
                        </h3>
                        <button onClick={() => setShowNotes(false)} className="text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 p-1 rounded-md transition-colors">
                            <X size={18} />
                        </button>
                    </div>
                    <div className="flex-1 p-4">
                        <textarea
                            className="w-full h-full bg-transparent text-zinc-200 resize-none outline-none text-sm leading-relaxed placeholder-zinc-600 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent"
                            placeholder="Type your notes here..."
                            autoFocus
                        />
                    </div>
                    <div className="p-3 bg-zinc-900/50 border-t border-zinc-800 text-[10px] text-zinc-500 text-center">
                        Notes are saved locally during the session
                    </div>
                </div>
            )}
        </>
    );
}
