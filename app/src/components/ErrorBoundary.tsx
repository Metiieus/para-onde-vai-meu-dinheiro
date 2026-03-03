import { Component, type ReactNode, type ErrorInfo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Componente ErrorBoundary para capturar erros de renderização.
 *
 * MELHORIA: Impede que um erro em um componente quebre a aplicação inteira,
 * exibindo uma UI de fallback amigável para o usuário.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Em produção, aqui seria enviado para um serviço de monitoramento (ex: Sentry)
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary capturou um erro:', error, info.componentStack);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="max-w-md w-full border-red-200">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" aria-hidden="true" />
              </div>
              <CardTitle className="text-red-700">Algo deu errado</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground text-sm">
                Ocorreu um erro inesperado nesta seção. Você pode tentar recarregar
                ou voltar para a página inicial.
              </p>
              {import.meta.env.DEV && this.state.error && (
                <details className="text-left text-xs bg-muted p-3 rounded-md">
                  <summary className="cursor-pointer font-medium mb-1">Detalhes do erro (dev)</summary>
                  <pre className="whitespace-pre-wrap break-all">{this.state.error.message}</pre>
                </details>
              )}
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={this.handleReset}>
                  <RefreshCw className="w-4 h-4 mr-2" aria-hidden="true" />
                  Tentar novamente
                </Button>
                <Button onClick={() => window.location.href = '/'}>
                  Ir para o início
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
