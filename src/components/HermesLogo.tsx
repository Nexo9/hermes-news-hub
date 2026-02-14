import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface HermesLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  animated?: boolean;
}

export function HermesLogo({ className, size = "md", showText = false, animated = true }: HermesLogoProps) {
  const sizes = {
    sm: "w-8 h-8",
    md: "w-11 h-11",
    lg: "w-16 h-16",
    xl: "w-24 h-24",
  };

  const textSizes = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-3xl",
    xl: "text-5xl",
  };

  const Wrapper = animated ? motion.div : "div";
  const wrapperProps = animated
    ? {
        initial: { opacity: 0, scale: 0.8 },
        animate: { opacity: 1, scale: 1 },
        transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] },
        whileHover: { scale: 1.05 },
      }
    : {};

  return (
    <Wrapper className={cn("flex items-center gap-2.5", className)} {...wrapperProps}>
      <div className={cn(sizes[size], "relative")}>
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Circle with gold gradient */}
          <defs>
            <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(38, 80%, 65%)" />
              <stop offset="50%" stopColor="hsl(38, 80%, 55%)" />
              <stop offset="100%" stopColor="hsl(28, 70%, 40%)" />
            </linearGradient>
            <linearGradient id="goldGradLight" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(38, 80%, 75%)" />
              <stop offset="100%" stopColor="hsl(38, 80%, 55%)" />
            </linearGradient>
          </defs>
          
          {/* Outer circle */}
          <circle cx="50" cy="50" r="47" fill="none" stroke="url(#goldGrad)" strokeWidth="2.5" />
          
          {/* Winged H */}
          <g transform="translate(50,50) scale(0.7) translate(-50,-50)">
            {/* Left wing - more detailed */}
            <path d="M18 55 Q14 38 24 25 Q30 18 36 20 Q28 30 26 42 Q25 50 28 55 Z" fill="url(#goldGrad)" />
            <path d="M22 50 Q20 40 26 30 Q30 24 33 26 Q28 34 27 42 Q26 48 28 52 Z" fill="url(#goldGradLight)" opacity="0.5" />
            
            {/* Right wing - more detailed */}
            <path d="M82 55 Q86 38 76 25 Q70 18 64 20 Q72 30 74 42 Q75 50 72 55 Z" fill="url(#goldGrad)" />
            <path d="M78 50 Q80 40 74 30 Q70 24 67 26 Q72 34 73 42 Q74 48 72 52 Z" fill="url(#goldGradLight)" opacity="0.5" />
            
            {/* H left vertical */}
            <rect x="36" y="24" width="8" height="54" rx="2" fill="url(#goldGrad)" />
            
            {/* H right vertical */}
            <rect x="56" y="24" width="8" height="54" rx="2" fill="url(#goldGrad)" />
            
            {/* H crossbar */}
            <rect x="44" y="46" width="12" height="8" rx="1" fill="url(#goldGrad)" />
          </g>
        </svg>
      </div>
      {showText && (
        <span className={cn("font-display font-bold tracking-wider text-foreground", textSizes[size])}>
          Hermès
        </span>
      )}
    </Wrapper>
  );
}
