import React, { Component, ErrorInfo, ReactNode } from "react";
import { MapPin, RefreshCw, AlertCircle } from "lucide-react";

interface Props {
  children: ReactNode;
  fallbackHeight?: number | string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class MapErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn("Map component error caught by MapErrorBoundary:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="relative rounded-2xl overflow-hidden border border-[#D9E5E3] bg-slate-50 flex flex-col items-center justify-center p-6 text-center shadow-xs"
          style={{ height: this.props.fallbackHeight || 400 }}
        >
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mb-3">
            <MapPin size={22} className="text-amber-600" />
          </div>
          <h4 className="font-bold text-slate-800 text-sm mb-1">Map is currently unavailable</h4>
          <p className="text-slate-500 text-xs max-w-xs mb-4">
            Interactive map rendering encountered an issue. You can still view all property details and chat with SAI seamlessly.
          </p>
          <button
            onClick={this.handleRetry}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#006D6A] hover:bg-[#004F4D] text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
          >
            <RefreshCw size={13} />
            <span>Retry Map</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
