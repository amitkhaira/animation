import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary caught an error]:', error, errorInfo);
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="p-3 bg-red-950/40 border border-red-500/40 rounded text-red-200 text-xs flex flex-col items-center justify-center m-2">
          <span className="font-semibold mb-1">Preview Notice</span>
          <span className="text-[11px] text-red-300/80 mb-2 text-center">
            {this.state.error?.message || 'Failed to render preview'}
          </span>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-2 py-0.5 bg-red-800/60 hover:bg-red-700 text-white rounded text-[10px]"
          >
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
