import { Component } from 'react';

/**
 * Error Boundary component to catch and handle errors in child components
 * Prevents entire app from crashing when a single component fails
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px',
          padding: '40px',
          background: 'var(--bg-panel)',
          borderRadius: '8px',
          border: '1px solid var(--border-dim)',
          margin: '16px',
        }}>
          <div style={{
            fontSize: '16px',
            fontWeight: '600',
            color: 'var(--text-primary)',
            marginBottom: '16px',
          }}>
            ⚠️ Component Error
          </div>
          <div style={{
            fontSize: '14px',
            color: 'var(--text-secondary)',
            marginBottom: '24px',
            textAlign: 'center',
            maxWidth: '500px',
          }}>
            This section encountered an error and cannot be displayed. Please refresh the page or contact support if the problem persists.
          </div>
          {process.env.NODE_ENV === 'development' && (
            <details style={{
              fontSize: '12px',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-dim)',
              padding: '12px',
              background: 'rgba(0,0,0,0.1)',
              borderRadius: '4px',
              maxWidth: '600px',
              overflow: 'auto',
              maxHeight: '200px',
            }}>
              <summary style={{ cursor: 'pointer', fontWeight: '600', marginBottom: '8px' }}>
                Error Details
              </summary>
              <pre style={{ margin: '8px 0', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {this.state.error?.toString()}
              </pre>
            </details>
          )}
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '24px',
              padding: '10px 24px',
              background: 'var(--accent)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
            }}
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
