import React from 'react';

type Props = { children: React.ReactNode };
type State = { hasError: boolean; error?: Error | null };

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Log to console (dev) — can be extended to send to server
    // eslint-disable-next-line no-console
    console.error('Unhandled error in UI:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-8">
          <div className="max-w-3xl rounded-lg border border-cal-border bg-cal-bg-card p-6">
            <h2 className="text-xl font-semibold text-cal-text-primary">Something went wrong</h2>
            <p className="mt-2 text-cal-text-muted">A client-side error occurred while rendering this page. Check the browser console for details.</p>
            {this.state.error && (
              <pre className="mt-4 whitespace-pre-wrap text-sm text-cal-text-dimmed">{String(this.state.error.stack || this.state.error.message || this.state.error)}</pre>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
