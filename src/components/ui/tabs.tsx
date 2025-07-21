'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

const TabsContext = React.createContext<{
  activeTab: string;
  setActiveTab: (value: string) => void;
}>({
  activeTab: '',
  setActiveTab: () => {},
});

interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
}

const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(
  ({ 
    className, 
    value: valueProp, 
    defaultValue, 
    onValueChange, 
    children, 
    ...props 
  }, ref) => {
    const [activeTab, setActiveTab] = React.useState(defaultValue || '');
    const value = valueProp || activeTab;
    
    const handleTabChange = (newValue: string) => {
      if (!valueProp) {
        setActiveTab(newValue);
      }
      onValueChange?.(newValue);
    };
    
    return (
      <TabsContext.Provider value={{ activeTab: value, setActiveTab: handleTabChange }}>
        <div
          ref={ref}
          className={cn('flex flex-col gap-2', className)}
          {...props}
        >
          {children}
        </div>
      </TabsContext.Provider>
    );
  }
);
Tabs.displayName = 'Tabs';

const TabsList = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground',
      className
    )}
    {...props}
  />
));
TabsList.displayName = 'TabsList';

interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
  active?: boolean;
}

const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ 
    className, 
    value, 
    active: activeProp, 
    onClick, 
    ...props 
  }, ref) => {
    const { activeTab, setActiveTab } = React.useContext(TabsContext);
    const isActive = activeProp !== undefined ? activeProp : activeTab === value;
    
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      setActiveTab(value);
      onClick?.(e);
    };
    
    return (
      <button
        ref={ref}
        type="button"
        role="tab"
        aria-selected={isActive}
        onClick={handleClick}
        className={cn(
          'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
          isActive ? 'bg-background text-foreground shadow-sm' : 'hover:text-foreground/80',
          className
        )}
        data-tab-trigger={value}
        {...props}
      />
    );
  }
);
TabsTrigger.displayName = 'TabsTrigger';

interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
  ({ 
    className, 
    value, 
    children, 
    ...props 
  }, ref) => {
    const { activeTab } = React.useContext(TabsContext);
    const isActive = activeTab === value;
    
    if (!isActive) return null;
    
    return (
      <div
        ref={ref}
        role="tabpanel"
        className={cn(
          'mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          className
        )}
        data-tab-content={value}
        {...props}
      >
        {children}
      </div>
    );
  }
);
TabsContent.displayName = 'TabsContent';

export { Tabs, TabsList as List, TabsTrigger as Trigger, TabsContent as Content };
