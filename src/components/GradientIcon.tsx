import React, { useId } from 'react';
import * as LucideIcons from 'lucide-react';

export interface GradientIconProps {
  name?: string;
  icon?: LucideIcons.LucideIcon;
  className?: string;
  strokeWidth?: number;
  gradientId?: string;
}

export const GlobalGradientDefs: React.FC = () => {
  return (
    <svg style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden', opacity: 0, pointerEvents: 'none' }} aria-hidden="true">
      <defs>
        {/* Main warm yellow to orange to red gradient matching the reference image */}
        <linearGradient id="warm-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#facc15" />
          <stop offset="50%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#ef4444" />
        </linearGradient>

        {/* Horizontal warm gradient variation */}
        <linearGradient id="warm-gradient-h" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="60%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#ea580c" />
        </linearGradient>

        {/* High contrast bright gradient */}
        <linearGradient id="warm-gradient-bright" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fde047" />
          <stop offset="50%" stopColor="#fb923c" />
          <stop offset="100%" stopColor="#f43f5e" />
        </linearGradient>
      </defs>
    </svg>
  );
};

export const GradientIcon: React.FC<GradientIconProps> = ({
  name,
  icon: IconComponentProp,
  className = 'w-5 h-5',
  strokeWidth = 2.2,
  gradientId = 'warm-gradient'
}) => {
  const instanceId = useId().replace(/[:]/g, '');
  const localGradId = `${gradientId}-${instanceId}`;

  let IconToRender: LucideIcons.LucideIcon = LucideIcons.CircleDollarSign;

  if (IconComponentProp) {
    IconToRender = IconComponentProp;
  } else if (name) {
    const found = (LucideIcons as Record<string, any>)[name];
    if (found) {
      IconToRender = found;
    }
  }

  return (
    <IconToRender
      className={className}
      stroke={`url(#${localGradId})`}
      color={`url(#${localGradId})`}
      strokeWidth={strokeWidth}
      style={{ stroke: `url(#${localGradId})` }}
    >
      <defs>
        <linearGradient id={localGradId} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#facc15" />
          <stop offset="50%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#ef4444" />
        </linearGradient>
      </defs>
    </IconToRender>
  );
};

