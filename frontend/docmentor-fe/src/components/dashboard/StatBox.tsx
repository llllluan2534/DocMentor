import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatBoxProps {
  title: string;
  value: number | string;
  unit?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red';
}

const colorVariants = {
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    icon: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-200 dark:border-blue-800'
  },
  green: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    icon: 'text-green-600 dark:text-green-400',
    border: 'border-green-200 dark:border-green-800'
  },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    icon: 'text-purple-600 dark:text-purple-400',
    border: 'border-purple-200 dark:border-purple-800'
  },
  orange: {
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    icon: 'text-orange-600 dark:text-orange-400',
    border: 'border-orange-200 dark:border-orange-800'
  },
  red: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    icon: 'text-red-600 dark:text-red-400',
    border: 'border-red-200 dark:border-red-800'
  }
};

export const StatBox: React.FC<StatBoxProps> = ({
  title,
  value,
  unit,
  icon,
  trend,
  color = 'blue'
}) => {
  const variant = colorVariants[color];

  return (
    <div className={`rounded-lg border ${variant.border} ${variant.bg} p-6`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
              {value}
            </h3>
            {unit && <span className="text-sm text-gray-500 dark:text-gray-400">{unit}</span>}
          </div>
          {trend && (
            <div className={`mt-2 flex items-center gap-1 text-sm ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {trend.isPositive ? (
                <TrendingUp size={16} />
              ) : (
                <TrendingDown size={16} />
              )}
              <span>{trend.value}% {trend.isPositive ? 'increase' : 'decrease'}</span>
            </div>
          )}
        </div>
        {icon && (
          <div className={`rounded-lg p-3 ${variant.bg}`}>
            <div className={`${variant.icon}`}>{icon}</div>
          </div>
        )}
      </div>
    </div>
  );
};
