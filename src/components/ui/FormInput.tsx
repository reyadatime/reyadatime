'use client';

import { forwardRef, useState } from 'react';
import { twMerge } from 'tailwind-merge';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, className, required, ...props }, ref) => {
    const [touched, setTouched] = useState(false);
    const isEmpty = touched && required && !props.value && !props.defaultValue;
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium input-label mb-1">
            {label}
          </label>
        )}
        <input
          ref={ref}
          onBlur={(e) => {
            setTouched(true);
            props.onBlur?.(e);
          }}
          className={twMerge(
            'block w-full rounded-md shadow-sm input-field transition-colors duration-200 text-sm py-1.5',
            'focus:outline-none focus:ring-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 dark:placeholder-slate-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500 backdrop-blur-sm',
            (error || isEmpty) && 'border-red-500 dark:border-red-500 focus:border-red-500 focus:ring-red-500',
            className
          )}
          {...props}
        />
        {(error || isEmpty) && (
          <p className="mt-1 text-sm text-red-500 dark:text-red-400">{error || 'This field is required'}</p>
        )}
      </div>
    );
  }
);

FormInput.displayName = 'FormInput';

export default FormInput;
