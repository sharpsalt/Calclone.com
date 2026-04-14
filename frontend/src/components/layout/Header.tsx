import { Link } from 'react-router-dom';

export function Header() {
    return (
        <header className="h-16 border-b border-cal-border bg-cal-bg-base/80 backdrop-blur-md sticky top-0 z-10 lg:hidden flex items-center px-4 justify-between">
            <Link to="/" className="font-bold text-lg text-cal-text-primary tracking-tight">
                Cal.com
            </Link>
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                <span className="text-xs font-bold text-white">AY</span>
            </div>
        </header>
    );
}
