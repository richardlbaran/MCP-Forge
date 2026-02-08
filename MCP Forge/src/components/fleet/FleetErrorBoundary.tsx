import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, Bug, Copy, CheckCircle } from 'lucide-react';

// ============= Types =============

interface FleetErrorBoundaryProps {
  /** Children to render */
  children: ReactNode;
  /** Custom fallback component */
  fallback?: ReactNode;
  /** Callback when error occurs */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Callback when reset is triggered */
  onReset?: () => void;
}

interface FleetErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  copied: boolean;
}

// ============= Error Fallback Component =============

interface ErrorFallbackProps {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  onReset: () => void;
}

function ErrorFallback({ error, errorInfo, onReset }: ErrorFallbackProps) {
  const [showDetails, setShowDetails] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const errorDetails = React.useMemo(() => {
    const parts: string[] = [];
    
    if (error) {
      parts.push(`Error: ${error.name}`);
      parts.push(`Message: ${error.message}`);
      if (error.stack) {
        parts.push(`\nStack Trace:\n${error.stack}`);
      }
    }
    
    if (errorInfo?.componentStack) {
      parts.push(`\nComponent Stack:${errorInfo.componentStack}`);
    }
    
    return parts.join('\n');
  }, [error, errorInfo]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(errorDetails);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy error details:', err);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-4"
      role="alert"
      aria-live="assertive"
    >
      {/* Icon */}
      <div className="w-20 h-20 rounded-full bg-forge-error/10 border border-forge-error/20 flex items-center justify-center mb-6">
        <AlertTriangle className="w-10 h-10 text-forge-error" aria-hidden="true" />
      </div>

      {/* Title */}
      <h2 className="text-xl font-semibold text-forge-text mb-2">
        Something went wrong
      </h2>

      {/* Description */}
      <p className="text-sm text-forge-text-muted text-center max-w-md mb-6">
        An error occurred while rendering Fleet Command. This is usually temporary.
        Try refreshing or click the button below to recover.
      </p>

      {/* Error message preview */}
      {error && (
        <div className="mb-6 max-w-md w-full">
          <div className="forge-card p-3 bg-forge-error/5 border-forge-error/20">
            <p className="text-sm font-mono text-forge-error truncate">
              {error.message || 'Unknown error'}
            </p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onReset}
          className="forge-btn-primary"
          aria-label="Retry loading Fleet Command"
        >
          <RefreshCw className="w-4 h-4" aria-hidden="true" />
          Try Again
        </button>

        <button
          onClick={() => setShowDetails(!showDetails)}
          className="forge-btn-secondary"
          aria-expanded={showDetails}
          aria-controls="error-details"
        >
          <Bug className="w-4 h-4" aria-hidden="true" />
          {showDetails ? 'Hide' : 'Show'} Details
        </button>
      </div>

      {/* Error details (collapsible) */}
      {showDetails && (
        <motion.div
          id="error-details"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="w-full max-w-2xl"
        >
          <div className="forge-card overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-forge-bg border-b border-forge-border">
              <span className="text-xs font-medium text-forge-text-muted">
                Error Details
              </span>
              <button
                onClick={handleCopy}
                className="forge-btn-ghost text-xs p-1.5"
                aria-label={copied ? 'Copied!' : 'Copy error details'}
              >
                {copied ? (
                  <CheckCircle className="w-3.5 h-3.5 text-forge-success" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            {/* Content */}
            <pre className="p-4 text-xs font-mono text-forge-text-secondary overflow-x-auto max-h-64 overflow-y-auto whitespace-pre-wrap break-words">
              {errorDetails}
            </pre>
          </div>
        </motion.div>
      )}

      {/* Help text */}
      <p className="text-2xs text-forge-text-muted mt-6 text-center">
        If this keeps happening, try refreshing the page or check the console for more details.
      </p>
    </motion.div>
  );
}

// ============= Error Boundary Class Component =============

export class FleetErrorBoundary extends Component<
  FleetErrorBoundaryProps,
  FleetErrorBoundaryState
> {
  constructor(props: FleetErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      copied: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<FleetErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log to console
    console.error('[FleetErrorBoundary] Caught error:', error);
    console.error('[FleetErrorBoundary] Component stack:', errorInfo.componentStack);

    // Update state with error info
    this.setState({ errorInfo });

    // Call optional callback
    this.props.onError?.(error, errorInfo);
  }

  handleReset = (): void => {
    // Call optional callback
    this.props.onReset?.();

    // Reset state
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      copied: false,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Use default error fallback
      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onReset={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}

export default FleetErrorBoundary;
