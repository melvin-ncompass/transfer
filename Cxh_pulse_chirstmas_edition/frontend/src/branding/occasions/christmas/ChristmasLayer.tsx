import React, { useRef, useEffect } from 'react';
import { Box } from '@mui/material';

interface ChristmasLayerProps {
    isActive?: boolean;
}

export function ChristmasLayer({ isActive = true }: ChristmasLayerProps) {
    const physicsCanvasRef = useRef<HTMLCanvasElement>(null);
    const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const gridRef = useRef<Uint8Array | null>(null);
    const widthRef = useRef(0); // Grid width
    const heightRef = useRef(0); // Grid height

    // Load Custom Cursor & Santa Image
    const cursorOnUrlRef = useRef<string>('');
    const cursorOffUrlRef = useRef<string>('');
    const santaImgRef = useRef<HTMLImageElement | null>(null);
    const reindeerImgRef = useRef<HTMLImageElement | null>(null);

    // Mouse State
    const isMouseDownRef = useRef(false);
    const mousePosRef = useRef({ x: -1000, y: -1000 });

    // Reindeer State
    const reindeerActiveRef = useRef(false);
    const reindeerEndTimeRef = useRef(0);

    useEffect(() => {
        // Helper to load and resize cursor
        const loadCursor = (src: string, ref: React.MutableRefObject<string>) => {
            const img = new Image();
            img.src = src;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const size = 64;
                canvas.width = size;
                canvas.height = size;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(img, 0, 0, size, size);
                    ref.current = canvas.toDataURL('image/png');
                }
            };
        };

        loadCursor('/assets/images/lighter-cursor.png', cursorOnUrlRef); // Flame On
        loadCursor('/assets/images/lighter-off.png', cursorOffUrlRef);   // Flame Off

        // Load Santa
        const imgSanta = new Image();
        imgSanta.src = '/assets/images/santa-flying.png';
        imgSanta.onload = () => {
            santaImgRef.current = imgSanta;
        };

        // Load Reindeer
        const imgReindeer = new Image();
        imgReindeer.src = '/assets/images/angry-reindeer.png';
        imgReindeer.onload = () => {
            reindeerImgRef.current = imgReindeer;
        };
    }, []);

    // Initialize and handle resize
    useEffect(() => {
        const physicsCanvas = physicsCanvasRef.current;
        const overlayCanvas = overlayCanvasRef.current;
        const container = containerRef.current;
        if (!physicsCanvas || !overlayCanvas || !container) return undefined;

        const resize = () => {
            // Physics Canvas: Low Res (1/4 scale)
            const scale = 4;
            physicsCanvas.width = Math.ceil(container.clientWidth / scale);
            physicsCanvas.height = Math.ceil(container.clientHeight / scale);

            // Overlay Canvas: High Res (Full scale)
            overlayCanvas.width = container.clientWidth;
            overlayCanvas.height = container.clientHeight;

            // Reset grid on resize
            gridRef.current = new Uint8Array(physicsCanvas.width * physicsCanvas.height).fill(0);
            widthRef.current = physicsCanvas.width;
            heightRef.current = physicsCanvas.height;
        };

        resize();
        window.addEventListener('resize', resize);
        return () => window.removeEventListener('resize', resize);
    }, []);

    // Simulation Loop (Snow + Santa + Melting)
    useEffect(() => {
        if (!isActive) return undefined;

        const physicsCanvas = physicsCanvasRef.current;
        const overlayCanvas = overlayCanvasRef.current;
        if (!physicsCanvas || !overlayCanvas) return undefined;

        const ctxPhysics = physicsCanvas.getContext('2d');
        const ctxOverlay = overlayCanvas.getContext('2d');
        if (!ctxPhysics || !ctxOverlay) return undefined;

        let animationFrame: number;

        // Snow generation parameters
        const snowGenRate = 4;

        // Santa State (Screen Coordinates)
        let santaActive = false;
        let santaX = -200;
        let santaY = 100;
        let nextSantaTime = Date.now() + Math.random() * 5000 + 2000;

        const update = () => {
            const gridWidth = widthRef.current;
            const gridHeight = heightRef.current;
            const grid = gridRef.current;
            const screenWidth = overlayCanvas.width;
            const screenHeight = overlayCanvas.height;

            if (!grid) return;

            // Clear Overlay
            ctxOverlay.clearRect(0, 0, screenWidth, screenHeight);

            // --- Reindeer Overlay Logic ---
            if (reindeerActiveRef.current) {
                if (Date.now() > reindeerEndTimeRef.current) {
                    reindeerActiveRef.current = false;
                } else if (reindeerImgRef.current) {
                    // Draw Reindeer Centered
                    const size = Math.min(screenWidth, screenHeight) * 0.8;
                    const x = (screenWidth - size) / 2;
                    const y = (screenHeight - size) / 2;

                    // Semi-transparent black background
                    ctxOverlay.fillStyle = 'rgba(0, 0, 0, 0.7)';
                    ctxOverlay.fillRect(0, 0, screenWidth, screenHeight);

                    ctxOverlay.drawImage(reindeerImgRef.current, x, y, size, size);
                }
            }

            // --- 1. Melting Logic (Continuous while mouse down) ---
            if (isMouseDownRef.current && !reindeerActiveRef.current) {
                const scaleX = gridWidth / screenWidth;
                const scaleY = gridHeight / screenHeight;

                // Convert screen mouse pos to grid pos
                const gridMouseX = mousePosRef.current.x * scaleX;
                const gridMouseY = mousePosRef.current.y * scaleY;
                const meltRadius = 8; // Grid pixels

                for (let y = Math.floor(gridMouseY - meltRadius); y <= Math.ceil(gridMouseY + meltRadius); y++) {
                    for (let x = Math.floor(gridMouseX - meltRadius); x <= Math.ceil(gridMouseX + meltRadius); x++) {
                        if (x >= 0 && x < gridWidth && y >= 0 && y < gridHeight) {
                            const dx = x - gridMouseX;
                            const dy = y - gridMouseY;
                            if (dx * dx + dy * dy <= meltRadius * meltRadius) {
                                grid[y * gridWidth + x] = 0;
                            }
                        }
                    }
                }
            }

            // --- 2. Santa Logic ---
            const now = Date.now();
            if (!santaActive && now > nextSantaTime) {
                santaActive = true;
                santaX = -150;
                santaY = screenHeight * 0.2 + Math.random() * (screenHeight * 0.2);
            }

            if (santaActive) {
                if (!reindeerActiveRef.current) {
                    santaX += 3; // Move right (Screen pixels)

                    // Bobbing motion
                    const bob = Math.sin(santaX * 0.02) * 10;
                    const currentY = santaY + bob;

                    // Draw Santa (High Res)
                    if (santaImgRef.current) {
                        const santaSize = 120; // Bigger, high res size
                        ctxOverlay.drawImage(santaImgRef.current, santaX, currentY, santaSize, santaSize);
                    }

                    // Check for Click on Santa
                    if (isMouseDownRef.current) {
                        const mouseX = mousePosRef.current.x;
                        const mouseY = mousePosRef.current.y;
                        const santaCenterX = santaX + 60;
                        const santaCenterY = currentY + 60;
                        const dist = Math.hypot(mouseX - santaCenterX, mouseY - santaCenterY);

                        if (dist < 50) { // Hit radius
                            reindeerActiveRef.current = true;
                            reindeerEndTimeRef.current = Date.now() + 2000; // 2 seconds
                        }
                    }

                    // Melt snow under Santa (Convert Screen -> Grid)
                    const scaleX = gridWidth / screenWidth;
                    const scaleY = gridHeight / screenHeight;

                    const gridSantaX = (santaX + 60) * scaleX; // Center of santa
                    const gridSantaY = (currentY + 60) * scaleY;
                    const meltRadius = 8; // Grid pixels

                    for (let y = Math.floor(gridSantaY - meltRadius); y <= Math.ceil(gridSantaY + meltRadius); y++) {
                        for (let x = Math.floor(gridSantaX - meltRadius); x <= Math.ceil(gridSantaX + meltRadius); x++) {
                            if (x >= 0 && x < gridWidth && y >= 0 && y < gridHeight) {
                                const dx = x - gridSantaX;
                                const dy = y - gridSantaY;
                                if (dx * dx + dy * dy <= meltRadius * meltRadius) {
                                    grid[y * gridWidth + x] = 0;
                                }
                            }
                        }
                    }
                }

                // Reset if off-screen right
                if (santaX > screenWidth + 100) {
                    santaActive = false;
                    nextSantaTime = Date.now() + Math.random() * 10000 + 5000;
                }
            }

            // --- 3. Snow Generation ---
            for (let i = 0; i < snowGenRate; i++) {
                const x = Math.floor(Math.random() * gridWidth);
                if (grid[x] === 0) grid[x] = 1;
            }

            // --- 4. Physics (Bottom-Up) ---
            for (let y = gridHeight - 2; y >= 0; y--) {
                for (let x = 0; x < gridWidth; x++) {
                    const idx = y * gridWidth + x;

                    if (grid[idx] === 1) {
                        const below = (y + 1) * gridWidth + x;
                        const belowLeft = (y + 1) * gridWidth + (x - 1);
                        const belowRight = (y + 1) * gridWidth + (x + 1);

                        if (grid[below] === 0) {
                            grid[below] = 1;
                            grid[idx] = 0;
                        } else if (x > 0 && grid[belowLeft] === 0) {
                            grid[belowLeft] = 1;
                            grid[idx] = 0;
                        } else if (x < gridWidth - 1 && grid[belowRight] === 0) {
                            grid[belowRight] = 1;
                            grid[idx] = 0;
                        }
                    }
                }
            }

            // --- 5. Render Snow ---
            ctxPhysics.clearRect(0, 0, gridWidth, gridHeight);

            const imgData = ctxPhysics.createImageData(gridWidth, gridHeight);
            const data = imgData.data;

            for (let i = 0; i < grid.length; i++) {
                if (grid[i] === 1) {
                    const idx = i * 4;
                    data[idx] = 255; data[idx + 1] = 255; data[idx + 2] = 255; data[idx + 3] = 240;
                }
            }
            ctxPhysics.putImageData(imgData, 0, 0);

            animationFrame = requestAnimationFrame(update);
        };

        animationFrame = requestAnimationFrame(update);
        return () => cancelAnimationFrame(animationFrame);
    }, [isActive]);

    // Handle Cursor & Mouse State
    useEffect(() => {
        if (!isActive) return undefined;

        const updateCursor = () => {
            // Only update cursor if below threshold (in snow area)
            const thresholdY = window.innerHeight * 0.4;
            if (mousePosRef.current.y > thresholdY) {
                const cursorUrl = isMouseDownRef.current ? cursorOnUrlRef.current : cursorOffUrlRef.current;
                if (cursorUrl) {
                    document.body.style.cursor = `url('${cursorUrl}') 16 16, auto`;
                }
            } else {
                document.body.style.cursor = 'default';
            }
        };

        const handleMouseDown = () => {
            isMouseDownRef.current = true;
            updateCursor();
        };

        const handleMouseUp = () => {
            isMouseDownRef.current = false;
            updateCursor();
        };

        const handleGlobalMouseMove = (e: MouseEvent) => {
            const physicsCanvas = physicsCanvasRef.current;
            if (!physicsCanvas) return;

            const rect = physicsCanvas.getBoundingClientRect();

            mousePosRef.current = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };

            updateCursor();
        };

        window.addEventListener('mousemove', handleGlobalMouseMove);
        window.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleGlobalMouseMove);
            window.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'default';
        };
    }, [isActive]);

    return (
        <Box
            ref={containerRef}
            sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: 15,
                pointerEvents: 'none',
                opacity: isActive ? 1 : 0,
                transition: 'opacity 1s ease-in',
            }}
        >
            {/* Physics Canvas (Low Res, Scaled Up) */}
            <canvas
                ref={physicsCanvasRef}
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    imageRendering: 'pixelated',
                    pointerEvents: 'none',
                }}
            />
            {/* Overlay Canvas (High Res) */}
            <canvas
                ref={overlayCanvasRef}
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    pointerEvents: 'none',
                }}
            />
        </Box>
    );
}
