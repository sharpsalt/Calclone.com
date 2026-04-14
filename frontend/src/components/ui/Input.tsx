import { cn } from '../../lib/utils';
import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export function Input({ label, error, className, required, id, ...props }: InputProps) {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    return (
        <div className="flex flex-col gap-1.5 w-full">
            {label && (
                <label htmlFor={inputId} className="text-sm font-medium text-cal-text-primary tracking-tight">
                    {label}
                    {required && <span className="text-cal-error ml-1">*</span>}
                </label>
            )}
            <input
                id={inputId}
                className={cn(
                    'cal-input',
                    'w-full h-10',
                    error && 'border-cal-error! focus:border-cal-error! focus:ring-1 focus:ring-cal-error!',
                    className
                )}
                required={required}
                {...props}
            />
            {error && <p className="text-xs text-cal-error mt-0.5">{error}</p>}
        </div>
    );
}
