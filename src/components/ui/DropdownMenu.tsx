'use client';

import { ReactNode, useState } from 'react';
import { FiChevronDown, FiCheck } from 'react-icons/fi';

type DropdownMenuProps = {
  children: ReactNode;
  trigger: ReactNode;
  className?: string;
};

export function DropdownMenu({ children, trigger, className = '' }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`relative inline-block text-left ${className}`}>
      <div onClick={() => setIsOpen(!isOpen)}>
        {trigger}
      </div>
      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-56 origin-top-right rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

type DropdownMenuItemProps = {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
};

export function DropdownMenuItem({ children, onClick, className = '' }: DropdownMenuItemProps) {
  return (
    <div 
      className={`px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

type DropdownMenuContentProps = {
  children: ReactNode;
  className?: string;
};

export function DropdownMenuContent({ children, className = '' }: DropdownMenuContentProps) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}
