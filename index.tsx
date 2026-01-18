
import React, { Component, ErrorInfo, ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

// ErrorBoundary component to catch rendering errors in the application.
// Fixed: Explicitly import Component and extend it with Props and State to ensure 'props' and 'state' are correctly typed and accessible.
class ErrorBoundary extends Component<Props, State> {
  // Initialize state directly as a class property for better TypeScript inference
  state: State = {
    hasError: false,
    error: null
  };

  // This static method is called during the render phase to update state after an error is thrown.
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  // This lifecycle method is called during the commit phase for error reporting.
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    // If an error has been caught, render the fallback UI.
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, background: '#09090b', color: '#ef4444', height: '100vh', fontFamily: 'monospace' }}>
          <h1>Something went wrong.</h1>
          <p>{this.state.error?.toString()}</p>
        </div>
      );
    }

    // Otherwise, render children normally.
    // Fixed: Accessing this.props.children which is now correctly recognized via inheritance from Component<Props, State>.
    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
