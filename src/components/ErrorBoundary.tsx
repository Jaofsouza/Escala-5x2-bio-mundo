import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  mensagem: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, mensagem: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      mensagem: error?.message || 'Erro inesperado ao carregar o aplicativo.',
    };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="main-container">
          <div className="card-superficie stack-md">
            <h2 className="titulo-secao">Não foi possível carregar os dados</h2>
            <p className="texto-suave">
              Ocorreu um erro ao conectar ou processar as informações da escala.
            </p>
            <div className="erro-inline">{this.state.mensagem}</div>
            <button
              type="button"
              className="btn-primario"
              onClick={() => window.location.reload()}
            >
              Recarregar aplicativo
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
