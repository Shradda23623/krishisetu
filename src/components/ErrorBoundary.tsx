import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary catches runtime errors in any child component tree and renders
 * a friendly fallback UI instead of letting the entire app crash to a white screen.
 *
 * Usage:
 *   <ErrorBoundary>
 *     <App />
 *   </ErrorBoundary>
 */
class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // In production, send this to a logging service (Sentry, LogRocket, etc.)
    // eslint-disable-next-line no-console
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div
          role="alert"
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
            textAlign: "center",
            fontFamily: "system-ui, -apple-system, sans-serif",
            background: "#fafaf9",
            color: "#1c1917",
          }}
        >
          <h1 style={{ fontSize: "1.75rem", marginBottom: "0.5rem" }}>
            Something went wrong
          </h1>
          <p style={{ maxWidth: "32rem", marginBottom: "1.5rem", color: "#57534e" }}>
            KrishiSetu hit an unexpected error. Please refresh the page. If the
            problem keeps happening, contact support.
          </p>
          {this.state.error?.message && (
            <pre
              style={{
                maxWidth: "40rem",
                whiteSpace: "pre-wrap",
                background: "#f5f5f4",
                padding: "0.75rem 1rem",
                borderRadius: "0.5rem",
                fontSize: "0.875rem",
                color: "#7c2d12",
                marginBottom: "1.5rem",
              }}
            >
              {this.state.error.message}
            </pre>
          )}
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: "0.6rem 1.25rem",
                background: "#15803d",
                color: "white",
                border: "none",
                borderRadius: "0.5rem",
                cursor: "pointer",
                fontSize: "0.95rem",
              }}
            >
              Reload page
            </button>
            <button
              onClick={this.handleReset}
              style={{
                padding: "0.6rem 1.25rem",
                background: "white",
                color: "#15803d",
                border: "1px solid #15803d",
                borderRadius: "0.5rem",
                cursor: "pointer",
                fontSize: "0.95rem",
              }}
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
