import { Component, type ErrorInfo, type ReactNode } from 'react';

const LAST_DOC_KEY = 'conceptmap-infinity:last-doc';
const DB_NAME = 'conceptmap-infinity';

type ErrorBoundaryProps = {
  children: ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
  errorMessage: string;
};

function deleteAppDatabase(name: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(name);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    request.onblocked = () => resolve();
  });
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    errorMessage: '',
  };

  public static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    const message = error instanceof Error ? error.message : 'Error inesperado en la UI.';
    return {
      hasError: true,
      errorMessage: message,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Unhandled UI error', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetStorage = async () => {
    try {
      localStorage.removeItem(LAST_DOC_KEY);
      await deleteAppDatabase(DB_NAME);
    } catch (error) {
      console.error('Storage reset failed', error);
    } finally {
      window.location.reload();
    }
  };

  public render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="error-boundary" role="alert">
        <div className="error-boundary__card">
          <h1>La aplicacion encontro un error</h1>
          <p>{this.state.errorMessage || 'Se produjo un error inesperado.'}</p>
          <div className="error-boundary__actions">
            <button type="button" onClick={this.handleReload}>
              Recargar
            </button>
            <button type="button" onClick={() => void this.handleResetStorage()}>
              Reset storage
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
