import { cn } from '../../lib/utils';

interface SwitchProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label?: string;
    disabled?: boolean;
    className?: string;
}

export function Switch({ checked, onChange, label, disabled, className }: SwitchProps) {
    return (
        <label
            className={cn(
                'inline-flex items-center gap-2 cursor-pointer',
                disabled && 'opacity-50 cursor-not-allowed',
                className
            )}
        >
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                onClick={() => !disabled && onChange(!checked)}
                className={cn(
                    'relative w-9 h-5 rounded-full transition-colors duration-200 cursor-pointer',
                    checked ? 'bg-cal-success' : 'bg-cal-bg-emphasis'
                )}
            >
                <span
                    className={cn(
                        'absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform duration-200 shadow-sm',
                        checked && 'translate-x-4'
                    )}
                />
            </button>
            {label && <span className="text-sm text-cal-text-default">{label}</span>}
        </label>
    );
}
