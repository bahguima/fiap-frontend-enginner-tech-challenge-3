/** Tempo total sem atividade até o logout (10 min). */
export const DEFAULT_IDLE_TIMEOUT_SECONDS = 600;
/** Duração do aviso prévio antes do logout (60 s). */
export const DEFAULT_IDLE_WARNING_SECONDS = 60;

export interface IdleConfig {
  timeoutSeconds: number;
  warningSeconds: number;
  /** Inatividade até abrir o aviso (`timeout - warning`). */
  warningAfterMs: number;
}

export interface IdleEnvironment {
  timeout?: string;
  warning?: string;
}

function parsePositiveInteger(value: string | undefined): number | null {
  const normalized = value?.trim() ?? "";
  if (!/^\d+$/.test(normalized)) return null;
  const parsed = parseInt(normalized, 10);
  return parsed > 0 ? parsed : null;
}

/**
 * Lê `NEXT_PUBLIC_IDLE_TIMEOUT_SECONDS` e `NEXT_PUBLIC_IDLE_WARNING_SECONDS`
 * (substituídas no build pelo `DefinePlugin`). Valores inválidos caem no
 * padrão:
 *
 * - timeout: inteiro ≥ 2; senão 600;
 * - aviso: inteiro ≥ 1 e menor que o timeout; senão 60 — ou metade do
 *   timeout, quando o timeout configurado for de até 60 s.
 */
export function resolveIdleConfig(
  environment: IdleEnvironment = {
    timeout: process.env.NEXT_PUBLIC_IDLE_TIMEOUT_SECONDS,
    warning: process.env.NEXT_PUBLIC_IDLE_WARNING_SECONDS,
  },
): IdleConfig {
  const configuredTimeout = parsePositiveInteger(environment.timeout);
  const timeoutSeconds =
    configuredTimeout !== null && configuredTimeout >= 2
      ? configuredTimeout
      : DEFAULT_IDLE_TIMEOUT_SECONDS;

  const configuredWarning = parsePositiveInteger(environment.warning);
  const warningSeconds =
    configuredWarning !== null && configuredWarning < timeoutSeconds
      ? configuredWarning
      : Math.min(DEFAULT_IDLE_WARNING_SECONDS, Math.floor(timeoutSeconds / 2));

  return {
    timeoutSeconds,
    warningSeconds,
    warningAfterMs: (timeoutSeconds - warningSeconds) * 1000,
  };
}
