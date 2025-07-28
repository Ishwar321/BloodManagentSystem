import React from 'react';

class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console and potentially to an error reporting service
    console.error('Global Error Boundary caught an error:', error);
    console.error('Error Info:', errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  handleReload = () => {
    // Clear error state and reload the page
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  handleGoHome = () => {
    // Clear error state and navigate to home
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-md-8 col-lg-6">
                <div className="card shadow-lg border-0">
                  <div className="card-body p-5 text-center">
                    <div className="mb-4">
                      <i className="fas fa-exclamation-triangle text-warning" style={{fontSize: '4rem'}}></i>
                    </div>
                    
                    <h2 className="text-danger mb-3">Oops! Something went wrong</h2>
                    
                    <p className="text-muted mb-4">
                      We're sorry, but something unexpected happened. This error has been logged and we'll look into it.
                    </p>

                    <div className="d-grid gap-2 d-md-flex justify-content-md-center">
                      <button 
                        className="btn btn-primary me-md-2"
                        onClick={this.handleReload}
                      >
                        <i className="fas fa-redo me-2"></i>
                        Reload Page
                      </button>
                      <button 
                        className="btn btn-outline-secondary"
                        onClick={this.handleGoHome}
                      >
                        <i className="fas fa-home me-2"></i>
                        Go Home
                      </button>
                    </div>

                    {/* Development error details */}
                    {process.env.NODE_ENV === 'development' && this.state.error && (
                      <div className="mt-4">
                        <button 
                          className="btn btn-link text-muted"
                          type="button"
                          data-bs-toggle="collapse"
                          data-bs-target="#errorDetails"
                          aria-expanded="false"
                        >
                          <small>Show Error Details (Development Only)</small>
                        </button>
                        <div className="collapse mt-2" id="errorDetails">
                          <div className="card bg-light">
                            <div className="card-body">
                              <h6 className="text-danger">Error:</h6>
                              <pre className="small text-start">
                                {this.state.error && this.state.error.toString()}
                              </pre>
                              <h6 className="text-danger mt-3">Stack Trace:</h6>
                              <pre className="small text-start">
                                {this.state.errorInfo.componentStack}
                              </pre>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default GlobalErrorBoundary;
