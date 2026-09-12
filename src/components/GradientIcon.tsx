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
        <linearGradient id="cool-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="50%" stopColor="#2dd4bf" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>

        <linearGradient id="cool-gradient-h" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6ee7b7" />
          <stop offset="60%" stopColor="#2dd4bf" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>

        <linearGradient id="cool-gradient-bright" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a7f3d0" />
          <stop offset="50%" stopColor="#5eead4" />
          <stop offset="100%" stopColor="#67e8f9" />
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
  gradientId = 'cool-gradient'
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
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="50%" stopColor="#2dd4bf" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>
      </defs>
    </IconToRender>
  );
};
