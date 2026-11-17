import { Suspense, type ReactNode } from "react";
import { lazyWithPreload } from "@dashboard/lib/lazyWithPreload";
import { VisuallyHidden } from "@banking/shared/ui/styles/shared";

/**
 * Modais do extrato em chunks próprios: formulário (react-hook-form + zod),
 * detalhes e exclusão só são baixados quando o usuário abre (ou demonstra
 * intenção de abrir) o respectivo diálogo.
 */
export const LazyTransactionFormModal = lazyWithPreload(() =>
  import("@dashboard/components/form/TransactionFormModal").then((module) => ({
    default: module.TransactionFormModal,
  })),
);

export const LazyTransactionDetailsModal = lazyWithPreload(() =>
  import("@dashboard/components/dashboard/TransactionDetailsModal").then(
    (module) => ({ default: module.TransactionDetailsModal }),
  ),
);

export const LazyDeleteTransactionModal = lazyWithPreload(() =>
  import("@dashboard/components/dashboard/DeleteTransactionModal").then(
    (module) => ({ default: module.DeleteTransactionModal }),
  ),
);

export const preloadTransactionFormModal = () => {
  void LazyTransactionFormModal.preload().catch(() => {
    // Nova tentativa acontece ao abrir o modal.
  });
};

interface ModalSuspenseProps {
  children: ReactNode;
}

/** Fallback acessível e sem deslocamento de layout enquanto o chunk chega. */
export function ModalSuspense({ children }: ModalSuspenseProps) {
  return (
    <Suspense
      fallback={<VisuallyHidden role="status">Carregando diálogo...</VisuallyHidden>}
    >
      {children}
    </Suspense>
  );
}
