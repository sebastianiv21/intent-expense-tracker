import { cn } from "@/lib/utils";

type IconProps = React.SVGProps<SVGSVGElement>;

export function IntentLogo({ className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-8 w-8", className)}
      {...props}
    >
      <circle cx="16" cy="16" r="16" fill="currentColor" fillOpacity="0.1" />
      <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fontSize="16" fill="currentColor">
        💰
      </text>
    </svg>
  );
}
