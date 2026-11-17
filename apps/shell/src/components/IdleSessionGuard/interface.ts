export interface IIdleSessionGuardProps {
  /** Inatividade até o aviso (padrão: `resolveIdleConfig`, 9 min). */
  warningAfterMs?: number;
  /** Contagem regressiva do aviso até o logout (padrão: `resolveIdleConfig`, 60 s). */
  countdownSeconds?: number;
}
