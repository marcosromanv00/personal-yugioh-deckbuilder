import React from 'react';

export interface DropdownOption<T = string> {
  value: T;
  label: string;
  badge?: string | number;
  icon?: React.ReactNode;
  description?: string;
  highlight?: boolean;
}

export interface PremiumDropdownProps<T = string> {
  options: DropdownOption<T>[];
  value: T;
  onChange: (value: T) => void;
  icon?: React.ReactNode;
  label?: string;
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
  menuClassName?: string;
  menuWidth?: string;
  size?: 'xs' | 'sm' | 'md';
  align?: 'left' | 'right' | 'full';
  disabled?: boolean;
  maxMenuHeight?: string;
  direction?: 'auto' | 'down' | 'up';
}
