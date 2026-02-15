import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import hermesLogo from "@/assets/hermes-logo-wing.png";

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
        <img
          src={hermesLogo}
          alt="Hermès Logo"
          className="w-full h-full object-contain"
          style={{ filter: "brightness(0) invert(1) sepia(1) saturate(3) hue-rotate(15deg) brightness(0.85)" }}
        />
      </div>
      {showText && (
        <span className={cn("font-display font-bold tracking-wider text-foreground", textSizes[size])}>
          Hermès
        </span>
      )}
    </Wrapper>
  );
}
