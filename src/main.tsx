import { StrictMode, Component } from 'react'
import type { ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

class ErrorBoundary extends Component<{children: ReactNode}, {error: Error | null}> {
  constructor(props: {children: ReactNode}) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: '2rem', color: 'red', backgroundColor: '#fee2e2', minHeight: '100vh', fontFamily: 'monospace' }}>
          <h2>Application Crashed</h2>
          <p>The React application threw an unhandled error during rendering:</p>
          <pre style={{ whiteSpace: 'pre-wrap', backgroundColor: '#fecaca', padding: '1rem', borderRadius: '4px' }}>
            {this.state.error.toString()}
          </pre>
          <p style={{ marginTop: '1rem' }}>Please share this error message back!</p>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
