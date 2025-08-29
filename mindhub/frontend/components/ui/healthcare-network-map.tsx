import React, { useRef, useEffect, useState } from "react";

type RoutePoint = {
  x: number;
  y: number;
  delay: number;
};

export const HealthcareNetworkMap = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Set up routes that represent healthcare data flow
  const routes: { start: RoutePoint; end: RoutePoint; color: string }[] = [
    {
      start: { x: 100, y: 150, delay: 0 },
      end: { x: 200, y: 80, delay: 2 },
      color: "rgba(8, 145, 178, 0.8)", // primary-600
    },
    {
      start: { x: 200, y: 80, delay: 2 },
      end: { x: 260, y: 120, delay: 4 },
      color: "rgba(8, 145, 178, 0.8)",
    },
    {
      start: { x: 50, y: 50, delay: 1 },
      end: { x: 150, y: 180, delay: 3 },
      color: "rgba(41, 169, 140, 0.8)", // secondary-600
    },
    {
      start: { x: 280, y: 60, delay: 0.5 },
      end: { x: 180, y: 180, delay: 2.5 },
      color: "rgba(236, 115, 103, 0.8)", // accent-500
    },
    {
      start: { x: 150, y: 200, delay: 1.5 },
      end: { x: 250, y: 170, delay: 3.5 },
      color: "rgba(168, 85, 247, 0.8)", // purple-500 (clinimetrix)
    },
    {
      start: { x: 80, y: 120, delay: 2.5 },
      end: { x: 220, y: 150, delay: 4.5 },
      color: "rgba(16, 185, 129, 0.8)", // emerald-500 (resources)
    },
  ];

  // Create dots for healthcare network visualization
  const generateHealthcareNodes = (width: number, height: number) => {
    const nodes = [];
    const gap = 15;
    const nodeRadius = 1.5;

    // Create nodes representing healthcare network infrastructure
    for (let x = 0; x < width; x += gap) {
      for (let y = 0; y < height; y += gap) {
        // Shape the nodes to form healthcare network patterns
        const isInNetwork =
          // Central hub (main clinic)
          (Math.sqrt(Math.pow(x - width * 0.5, 2) + Math.pow(y - height * 0.4, 2)) < width * 0.15) ||
          // Patient care centers
          (Math.sqrt(Math.pow(x - width * 0.2, 2) + Math.pow(y - height * 0.3, 2)) < width * 0.08) ||
          (Math.sqrt(Math.pow(x - width * 0.8, 2) + Math.pow(y - height * 0.3, 2)) < width * 0.08) ||
          // Remote consultation points
          (Math.sqrt(Math.pow(x - width * 0.3, 2) + Math.pow(y - height * 0.7, 2)) < width * 0.06) ||
          (Math.sqrt(Math.pow(x - width * 0.7, 2) + Math.pow(y - height * 0.7, 2)) < width * 0.06) ||
          // Specialist clinics
          (Math.sqrt(Math.pow(x - width * 0.15, 2) + Math.pow(y - height * 0.6, 2)) < width * 0.05) ||
          (Math.sqrt(Math.pow(x - width * 0.85, 2) + Math.pow(y - height * 0.6, 2)) < width * 0.05) ||
          // Connection lines between nodes
          (Math.abs(y - height * 0.4) < 3 && x > width * 0.2 && x < width * 0.8) ||
          (Math.abs(x - width * 0.5) < 3 && y > height * 0.3 && y < height * 0.7);

        if (isInNetwork && Math.random() > 0.2) {
          // Different node types with different colors
          let nodeColor = "rgba(8, 145, 178, 0.6)"; // primary
          let radius = nodeRadius;
          
          // Central hub nodes (larger, primary color)
          if (Math.sqrt(Math.pow(x - width * 0.5, 2) + Math.pow(y - height * 0.4, 2)) < width * 0.05) {
            nodeColor = "rgba(8, 145, 178, 0.9)";
            radius = 2.5;
          }
          // Patient care nodes (secondary color)
          else if (
            Math.sqrt(Math.pow(x - width * 0.2, 2) + Math.pow(y - height * 0.3, 2)) < width * 0.05 ||
            Math.sqrt(Math.pow(x - width * 0.8, 2) + Math.pow(y - height * 0.3, 2)) < width * 0.05
          ) {
            nodeColor = "rgba(41, 169, 140, 0.8)";
            radius = 2;
          }
          // Specialist nodes (accent color)
          else if (
            Math.sqrt(Math.pow(x - width * 0.3, 2) + Math.pow(y - height * 0.7, 2)) < width * 0.04 ||
            Math.sqrt(Math.pow(x - width * 0.7, 2) + Math.pow(y - height * 0.7, 2)) < width * 0.04
          ) {
            nodeColor = "rgba(236, 115, 103, 0.8)";
            radius = 1.8;
          }

          nodes.push({
            x,
            y,
            radius,
            color: nodeColor,
            opacity: Math.random() * 0.4 + 0.4,
          });
        }
      }
    }
    return nodes;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeObserver = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height });
      canvas.width = width;
      canvas.height = height;
    });

    resizeObserver.observe(canvas.parentElement as Element);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    if (!dimensions.width || !dimensions.height) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const nodes = generateHealthcareNodes(dimensions.width, dimensions.height);
    let animationFrameId: number;
    let startTime = Date.now();

    // Draw background nodes
    function drawNodes() {
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);
      
      // Draw the healthcare network nodes
      nodes.forEach(node => {
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = node.color;
        ctx.fill();
      });
    }

    // Draw animated data flow routes
    function drawDataFlow() {
      const currentTime = (Date.now() - startTime) / 1000; // Time in seconds
      
      routes.forEach(route => {
        const elapsed = currentTime - route.start.delay;
        if (elapsed <= 0) return;
        
        const duration = 3; // Animation duration in seconds
        const progress = Math.min(elapsed / duration, 1);
        
        const x = route.start.x + (route.end.x - route.start.x) * progress;
        const y = route.start.y + (route.end.y - route.start.y) * progress;
        
        // Draw the data flow line
        ctx.beginPath();
        ctx.moveTo(route.start.x, route.start.y);
        ctx.lineTo(x, y);
        ctx.strokeStyle = route.color;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw the source node
        ctx.beginPath();
        ctx.arc(route.start.x, route.start.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = route.color;
        ctx.fill();
        
        // Draw the moving data point
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fillStyle = route.color;
        ctx.fill();
        
        // Add pulse effect to the moving point
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.fillStyle = route.color.replace('0.8', '0.3');
        ctx.fill();
        
        // Outer pulse
        ctx.beginPath();
        ctx.arc(x, y, 12, 0, Math.PI * 2);
        ctx.fillStyle = route.color.replace('0.8', '0.1');
        ctx.fill();
        
        // If the route is complete, draw the destination node
        if (progress === 1) {
          ctx.beginPath();
          ctx.arc(route.end.x, route.end.y, 4, 0, Math.PI * 2);
          ctx.fillStyle = route.color;
          ctx.fill();
        }
      });
    }
    
    // Animation loop
    function animate() {
      drawNodes();
      drawDataFlow();
      
      // If all routes are complete, restart the animation
      const currentTime = (Date.now() - startTime) / 1000;
      if (currentTime > 18) { // Reset after 18 seconds
        startTime = Date.now();
      }
      
      animationFrameId = requestAnimationFrame(animate);
    }
    
    animate();

    return () => cancelAnimationFrame(animationFrameId);
  }, [dimensions]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
};