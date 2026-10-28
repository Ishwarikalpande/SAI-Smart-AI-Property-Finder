import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6 bg-slate-50">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-xl border border-red-100">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2">
              {this.props.fallbackTitle || "Something went wrong"}
            </h3>
            <p className="text-slate-500 text-xs mb-6 leading-relaxed">
              {this.props.fallbackMessage ||
                "An unexpected issue occurred while rendering this view. You can reload or return to the main dashboard."}
            </p>
            {this.state.error && (
              <div className="bg-slate-100 rounded-xl p-3 text-left text-[11px] font-mono text-slate-600 mb-6 overflow-x-auto max-h-32">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 py-3 bg-[#006D6A] text-white font-bold text-xs rounded-xl hover:bg-[#004F4D] transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw size={14} />
                <span>Try Again</span>
              </button>
              <button
                onClick={() => {
                  window.location.href = "/";
                }}
                className="py-3 px-4 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
              >
                <Home size={14} />
                <span>Home</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
