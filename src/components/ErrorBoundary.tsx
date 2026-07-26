import React, { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error inside KitchenSync Boundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    try {
      localStorage.removeItem('kitchensync_saved_accounts');
    } catch (e) {
      console.error(e);
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-950 text-gray-100 p-6 font-sans relative overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />

          <div className="max-w-md w-full bg-gray-900/60 backdrop-blur-xl border border-gray-800 rounded-3xl p-8 shadow-2xl text-center z-10 relative">
            <div className="mx-auto w-20 h-20 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center justify-center mb-6">
              <span className="text-4xl">⚠️</span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-white mb-2">
              System Interrupted
            </h1>
            <p className="text-gray-400 text-sm mb-6">
              KitchenSync encountered an unexpected runtime error. We've captured the diagnostics and isolated the fault.
            </p>

            {this.state.error && (
              <div className="bg-black/50 border border-gray-800 rounded-xl p-4 mb-6 text-left overflow-auto max-h-32 text-xs font-mono text-red-400">
                <span className="font-bold text-gray-400">Error:</span> {this.state.error.message}
                {this.state.error.stack && (
                  <div className="mt-2 text-[10px] text-gray-500 whitespace-pre">
                    {this.state.error.stack.split('\n').slice(0, 3).join('\n')}
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col gap-3">
              <button
                id="error-reset-button"
                onClick={this.handleReset}
                className="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-medium py-3 px-4 rounded-xl transition-colors duration-200 cursor-pointer shadow-lg shadow-blue-900/20"
              >
                Reset Application State
              </button>
              <button
                id="error-safety-button"
                onClick={() => window.location.href = '/'}
                className="w-full bg-gray-800 hover:bg-gray-700 active:bg-gray-900 text-gray-300 font-medium py-3 px-4 rounded-xl transition-colors duration-200 cursor-pointer"
              >
                Return to Safety
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
