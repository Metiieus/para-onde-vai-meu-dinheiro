import { useState, useEffect } from 'react';

/**
 * Hook para aplicar debounce em um valor.
 * Evita que buscas sejam disparadas a cada tecla pressionada,
 * aguardando o usuário parar de digitar antes de executar a ação.
 *
 * @param value - O valor a ser "debounced"
 * @param delay - O atraso em milissegundos (padrão: 400ms)
 */
export function useDebounce<T>(value: T, delay = 400): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cancela o timer anterior se o valor mudar antes do delay
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
