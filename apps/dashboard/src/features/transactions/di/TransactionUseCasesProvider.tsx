import { createContext, useContext, type ReactNode } from "react";
import type { TransactionUseCases } from "@banking/shared/application";
import { createRestTransactionUseCases } from "./composition";

/**
 * Injeção de dependência dos casos de uso de transações.
 *
 * O contexto entrega apenas objetos de serviço estáveis; nenhum dado de
 * servidor é guardado aqui (isso continua no TanStack Query). O valor padrão
 * usa o repositório REST, de modo que views renderizadas fora do provider
 * (ex.: testes de página) mantêm o comportamento atual.
 */
const defaultTransactionUseCases = createRestTransactionUseCases();

const TransactionUseCasesContext = createContext<TransactionUseCases>(
  defaultTransactionUseCases,
);

export interface TransactionUseCasesProviderProps {
  children: ReactNode;
  useCases?: TransactionUseCases;
}

export function TransactionUseCasesProvider({
  children,
  useCases = defaultTransactionUseCases,
}: TransactionUseCasesProviderProps) {
  return (
    <TransactionUseCasesContext.Provider value={useCases}>
      {children}
    </TransactionUseCasesContext.Provider>
  );
}

export function useTransactionUseCases(): TransactionUseCases {
  return useContext(TransactionUseCasesContext);
}
