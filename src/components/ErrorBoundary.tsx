import { Component, type ErrorInfo, type ReactNode } from 'react';
import { resetAppData } from '../persistence/reset';

type ErrorBoundaryProps = {
  children: ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
  errorMessage: string;
};

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
      await resetAppData();
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
          <h1>La aplicación encontró un error</h1>
          <p>{this.state.errorMessage || 'Se produjo un error inesperado.'}</p>
          <div className="error-boundary__actions">
            <button type="button" onClick={this.handleReload}>
              Recargar
            </button>
            <button type="button" onClick={() => void this.handleResetStorage()}>
              Reiniciar almacenamiento
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
