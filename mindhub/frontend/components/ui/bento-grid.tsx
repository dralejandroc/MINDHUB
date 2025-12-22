import { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

const BentoGrid = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={cn(
        "grid w-full auto-rows-[22rem] grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4",
        className,
      )}
    >
      {children}
    </motion.div>
  );
};

const BentoCard = ({
  name,
  className,
  background,
  Icon,
  description,
  href,
  cta,
  delay = 0,
}: {
  name: string;
  className: string;
  background: ReactNode;
  Icon: any;
  description: string;
  href: string;
  cta: string;
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    whileHover={{ y: -5 }}
    key={name}
    className={cn(
      "group relative flex flex-col justify-between overflow-hidden rounded-2xl",
      // Light styles with Glian colors
      "bg-white [box-shadow:0_0_0_1px_rgba(8,145,178,0.1),0_2px_4px_rgba(8,145,178,0.05),0_12px_24px_rgba(8,145,178,0.05)]",
      // Hover effects
      "hover:[box-shadow:0_0_0_2px_rgba(8,145,178,0.2),0_8px_16px_rgba(8,145,178,0.1),0_20px_32px_rgba(8,145,178,0.1)]",
      // Dark mode support
      "transform-gpu dark:bg-gray-900 dark:[border:1px_solid_rgba(255,255,255,.1)] dark:[box-shadow:0_-20px_80px_-20px_#0891b21f_inset]",
      "transition-all duration-300",
      className,
    )}
  >
    <div className="absolute inset-0 opacity-50 transition-opacity duration-300 group-hover:opacity-100">
      {background}
    </div>
    
    <div className="pointer-events-none z-10 flex transform-gpu flex-col gap-1 p-6 transition-all duration-300 group-hover:-translate-y-10">
      <motion.div
        initial={{ scale: 1 }}
        whileHover={{ scale: 0.9 }}
        transition={{ type: "spring", stiffness: 400, damping: 10 }}
      >
        <Icon className="h-12 w-12 origin-left transform-gpu text-teal-600 transition-all duration-300 ease-in-out group-hover:scale-75" />
      </motion.div>
      <h3 className="text-xl font-semibold bg-gradient-to-r from-teal-700 to-cyan-600 bg-clip-text text-transparent">
        {name}
      </h3>
      <p className="max-w-lg text-gray-600 dark:text-gray-400">{description}</p>
    </div>

    <div
      className={cn(
        "pointer-events-none absolute bottom-0 flex w-full translate-y-10 transform-gpu flex-row items-center p-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100",
      )}
    >
      <a 
        href={href}
        className="pointer-events-auto inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md bg-gradient-to-r from-teal-600 to-cyan-600 text-white hover:from-teal-700 hover:to-cyan-700 transition-colors"
      >
        {cta}
        <ArrowRight className="ml-2 h-4 w-4" />
      </a>
    </div>
    
    <div className="pointer-events-none absolute inset-0 transform-gpu transition-all duration-300 group-hover:bg-gradient-to-t group-hover:from-teal-50/50 group-hover:to-transparent dark:group-hover:from-teal-950/20" />
  </motion.div>
);

// Animated background patterns for cards
export const GridPattern = ({ className }: { className?: string }) => (
  <svg className={cn("absolute inset-0 h-full w-full", className)}>
    <defs>
      <pattern
        id="grid-pattern"
        width="40"
        height="40"
        patternUnits="userSpaceOnUse"
      >
        <path
          d="M 40 0 L 0 0 0 40"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          className="text-teal-100 dark:text-teal-900"
        />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#grid-pattern)" />
  </svg>
);

export const DotPattern = ({ className }: { className?: string }) => (
  <svg className={cn("absolute inset-0 h-full w-full", className)}>
    <defs>
      <pattern
        id="dot-pattern"
        width="20"
        height="20"
        patternUnits="userSpaceOnUse"
      >
        <circle
          cx="2"
          cy="2"
          r="1"
          fill="currentColor"
          className="text-teal-200 dark:text-teal-800"
        />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#dot-pattern)" />
  </svg>
);

export const WavePattern = ({ className }: { className?: string }) => (
  <div className={cn("absolute inset-0 overflow-hidden", className)}>
    <svg
      className="absolute bottom-0 w-full"
      viewBox="0 0 1440 320"
      preserveAspectRatio="none"
    >
      <motion.path
        initial={{ d: "M0,160L48,144C96,128,192,96,288,106.7C384,117,480,171,576,197.3C672,224,768,224,864,213.3C960,203,1056,181,1152,181.3C1248,181,1344,203,1392,213.3L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z" }}
        animate={{ 
          d: [
            "M0,160L48,144C96,128,192,96,288,106.7C384,117,480,171,576,197.3C672,224,768,224,864,213.3C960,203,1056,181,1152,181.3C1248,181,1344,203,1392,213.3L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z",
            "M0,192L48,197.3C96,203,192,213,288,192C384,171,480,117,576,117.3C672,117,768,171,864,197.3C960,224,1056,224,1152,213.3C1248,203,1344,181,1392,170.7L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z",
            "M0,160L48,144C96,128,192,96,288,106.7C384,117,480,171,576,197.3C672,224,768,224,864,213.3C960,203,1056,181,1152,181.3C1248,181,1344,203,1392,213.3L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          ]
        }}
        transition={{ 
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        fill="url(#wave-gradient)"
        className="drop-shadow-lg"
      />
      <defs>
        <linearGradient id="wave-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(8, 145, 178, 0.1)" />
          <stop offset="50%" stopColor="rgba(41, 169, 140, 0.1)" />
          <stop offset="100%" stopColor="rgba(236, 115, 103, 0.1)" />
        </linearGradient>
      </defs>
    </svg>
  </div>
);

export const PulseCircle = ({ className }: { className?: string }) => (
  <div className={cn("absolute inset-0 flex items-center justify-center", className)}>
    <motion.div
      className="h-32 w-32 rounded-full bg-gradient-to-r from-teal-400 to-cyan-400"
      animate={{
        scale: [1, 1.2, 1],
        opacity: [0.3, 0.1, 0.3],
      }}
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
    <motion.div
      className="absolute h-24 w-24 rounded-full bg-gradient-to-r from-primary-400 to-secondary-400"
      animate={{
        scale: [1, 1.3, 1],
        opacity: [0.2, 0.05, 0.2],
      }}
      transition={{
        duration: 4,
        delay: 0.5,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  </div>
);

export { BentoCard, BentoGrid };