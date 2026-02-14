import { cn } from "@/lib/utils";

interface HermesLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
}

export function HermesLogo({ className, size = "md", showText = false }: HermesLogoProps) {
  const sizes = {
    sm: "w-7 h-7",
    md: "w-10 h-10",
    lg: "w-14 h-14",
    xl: "w-20 h-20",
  };

  const textSizes = {
    sm: "text-base",
    md: "text-xl",
    lg: "text-3xl",
    xl: "text-5xl",
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <svg
        viewBox="0 0 100 100"
        className={cn(sizes[size], "text-foreground")}
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Circle border */}
        <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="3" />
        {/* Winged H - stylized */}
        <g transform="translate(50,50) scale(0.65) translate(-50,-50)">
          {/* Left wing */}
          <path d="M20 58 Q15 40 25 28 Q32 20 38 22 Q30 32 28 45 Q27 52 30 58 Z" />
          {/* Right wing */}
          <path d="M80 58 Q85 40 75 28 Q68 20 62 22 Q70 32 72 45 Q73 52 70 58 Z" />
          {/* H left vertical */}
          <path d="M35 25 L35 78 Q35 80 37 80 L42 80 Q44 80 44 78 L44 25 Q44 23 42 23 L37 23 Q35 23 35 25 Z" />
          {/* H right vertical */}
          <path d="M56 25 L56 78 Q56 80 58 80 L63 80 Q65 80 65 78 L65 25 Q65 23 63 23 L58 23 Q56 23 56 25 Z" />
          {/* H crossbar */}
          <path d="M44 47 L56 47 L56 55 L44 55 Z" />
        </g>
      </svg>
      {showText && (
        <span className={cn("font-bold tracking-wider text-foreground", textSizes[size])}>
          Hermès
        </span>
      )}
    </div>
  );
}
