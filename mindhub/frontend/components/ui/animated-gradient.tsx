import React, { useMemo, useRef } from "react";
import { cn } from "@/lib/utils";
import { useDimensions } from "@/components/hooks";

interface AnimatedGradientProps {
  colors: string[];
  speed?: number;
  blur?: "light" | "medium" | "heavy";
  className?: string;
}

const randomInt = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const AnimatedGradient: React.FC<AnimatedGradientProps> = ({
  colors,
  speed = 5,
  blur = "light",
  className,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const dimensions = useDimensions(containerRef);

  const circleSize = useMemo(
    () => Math.max(dimensions.width, dimensions.height) * 0.3, // Made smaller for dashboard
    [dimensions.width, dimensions.height]
  );

  const blurClass =
    blur === "light"
      ? "blur-xl" // Reduced blur for dashboard
      : blur === "medium"
      ? "blur-2xl"
      : "blur-3xl"; // Reduced maximum blur

  return (
    <div ref={containerRef} className={cn("absolute inset-0 overflow-hidden", className)}>
      <div className={cn(`absolute inset-0`, blurClass)}>
        {colors.map((color, index) => (
          <svg
            key={index}
            className="absolute animate-background-gradient"
            style={
              {
                top: `${Math.random() * 70}%`, // Adjusted positioning
                left: `${Math.random() * 70}%`,
                "--background-gradient-speed": `${1 / speed}s`,
                "--tx-1": Math.random() - 0.5,
                "--ty-1": Math.random() - 0.5,
                "--tx-2": Math.random() - 0.5,
                "--ty-2": Math.random() - 0.5,
                "--tx-3": Math.random() - 0.5,
                "--ty-3": Math.random() - 0.5,
                "--tx-4": Math.random() - 0.5,
                "--ty-4": Math.random() - 0.5,
              } as React.CSSProperties
            }
            width={Math.max(circleSize * randomInt(0.3, 0.8), 20)} // Smaller circles for dashboard
            height={Math.max(circleSize * randomInt(0.3, 0.8), 20)}
            viewBox="0 0 100 100"
          >
            <circle
              cx="50"
              cy="50"
              r="50"
              fill={color}
              className="opacity-20 dark:opacity-[0.1]" // Reduced opacity for subtlety
            />
          </svg>
        ))}
      </div>
    </div>
  );
};

export { AnimatedGradient };