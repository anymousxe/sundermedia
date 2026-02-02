'use client';

import { useEffect, useRef } from 'react';

interface Shape {
    x: number;
    y: number;
    size: number;
    dx: number;
    dy: number;
    rotation: number;
    rotationSpeed: number;
    hue: number;
    hueSpeed: number;
    type: 'circle' | 'square' | 'triangle';
}

export default function AnimatedBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size
        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        // Create shapes
        const shapes: Shape[] = [];
        const numShapes = 15;

        for (let i = 0; i < numShapes; i++) {
            shapes.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * 60 + 30,
                dx: (Math.random() - 0.5) * 0.5,
                dy: (Math.random() - 0.5) * 0.5,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.02,
                hue: Math.random() * 360,
                hueSpeed: Math.random() * 0.5,
                type: ['circle', 'square', 'triangle'][Math.floor(Math.random() * 3)] as Shape['type'],
            });
        }

        // Animation loop
        let animationId: number;
        const animate = () => {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            shapes.forEach((shape) => {
                // Update position
                shape.x += shape.dx;
                shape.y += shape.dy;

                // Bounce off edges
                if (shape.x < 0 || shape.x > canvas.width) shape.dx *= -1;
                if (shape.y < 0 || shape.y > canvas.height) shape.dy *= -1;

                // Update rotation and color
                shape.rotation += shape.rotationSpeed;
                shape.hue = (shape.hue + shape.hueSpeed) % 360;

                // Draw shape
                ctx.save();
                ctx.translate(shape.x, shape.y);
                ctx.rotate(shape.rotation);
                ctx.fillStyle = `hsla(${shape.hue}, 70%, 60%, 0.3)`;
                ctx.strokeStyle = `hsla(${shape.hue}, 70%, 60%, 0.6)`;
                ctx.lineWidth = 2;

                if (shape.type === 'circle') {
                    ctx.beginPath();
                    ctx.arc(0, 0, shape.size / 2, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.stroke();
                } else if (shape.type === 'square') {
                    ctx.fillRect(-shape.size / 2, -shape.size / 2, shape.size, shape.size);
                    ctx.strokeRect(-shape.size / 2, -shape.size / 2, shape.size, shape.size);
                } else {
                    ctx.beginPath();
                    ctx.moveTo(0, -shape.size / 2);
                    ctx.lineTo(shape.size / 2, shape.size / 2);
                    ctx.lineTo(-shape.size / 2, shape.size / 2);
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();
                }

                ctx.restore();
            });

            animationId = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            cancelAnimationFrame(animationId);
            window.removeEventListener('resize', resizeCanvas);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: -1,
                background: '#000',
            }}
        />
    );
}
