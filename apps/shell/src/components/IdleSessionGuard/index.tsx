import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { useAuth } from "@banking/shared/auth";
import { useIdleTimer } from "@banking/shared/reactive";
import { resolveIdleConfig } from "./config";
import type { IIdleSessionGuardProps } from "./interface";
import {
  Actions,
  Content,
  Countdown,
  Description,
  Overlay,
  PrimaryButton,
  SecondaryButton,
  Title,
} from "./styled";

const formatCountdown = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}:${rest.toString().padStart(2, "0")}`;
};

interface IdleWatchProps {
  warningAfterMs: number;
  countdownSeconds: number;
  onTimeout: () => void;
  onLogoutNow: () => void;
}

/**
 * Observa a inatividade somente enquanto há sessão. O aviso exige uma ação
 * explícita (WCAG 2.2.1): mover o mouse não o fecha; "Continuar conectado",
 * Esc ou "Sair agora" sim. O prazo usa horário absoluto, então continua
 * correto mesmo se a aba ficar em segundo plano e os timers atrasarem.
 */
const IdleWatch = ({
  warningAfterMs,
  countdownSeconds,
  onTimeout,
  onLogoutNow,
}: IdleWatchProps) => {
  const { idle, reset } = useIdleTimer(warningAfterMs);
  const [deadline, setDeadline] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const timedOut = useRef(false);

  useEffect(() => {
    if (idle && deadline === null) {
      const startedAt = Date.now();
      setNow(startedAt);
      setDeadline(startedAt + countdownSeconds * 1000);
    }
  }, [countdownSeconds, deadline, idle]);

  useEffect(() => {
    if (deadline === null) return;
    const interval = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(interval);
  }, [deadline]);

  const remainingSeconds =
    deadline === null
      ? countdownSeconds
      : Math.max(0, Math.ceil((deadline - now) / 1000));

  useEffect(() => {
    if (deadline !== null && remainingSeconds === 0 && !timedOut.current) {
      timedOut.current = true;
      onTimeout();
    }
  }, [deadline, onTimeout, remainingSeconds]);

  const stayConnected = () => {
    reset();
    setDeadline(null);
  };

  return (
    <AlertDialog.Root
      open={deadline !== null}
      onOpenChange={(open) => {
        if (!open) stayConnected();
      }}
    >
      <AlertDialog.Portal>
        <Overlay />
        <Content>
          <Title>Sua sessão está prestes a expirar</Title>
          <Description>
            Por segurança, você será desconectado por inatividade em{" "}
            <Countdown role="timer" aria-live="off">
              {formatCountdown(remainingSeconds)}
            </Countdown>
            . Deseja continuar conectado?
          </Description>
          <Actions>
            <AlertDialog.Action asChild>
              <SecondaryButton type="button" onClick={onLogoutNow}>
                Sair agora
              </SecondaryButton>
            </AlertDialog.Action>
            {/* Cancel recebe o foco inicial: a ação segura é manter a sessão. */}
            <AlertDialog.Cancel asChild>
              <PrimaryButton type="button">Continuar conectado</PrimaryButton>
            </AlertDialog.Cancel>
          </Actions>
        </Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
};

/**
 * Logout automático por inatividade, com aviso prévio acessível. Por padrão,
 * o aviso abre após 9 min sem atividade e o logout ocorre 60 s depois
 * (`NEXT_PUBLIC_IDLE_TIMEOUT_SECONDS`/`NEXT_PUBLIC_IDLE_WARNING_SECONDS`,
 * ver `resolveIdleConfig`). As props sobrescrevem a configuração.
 */
export const IdleSessionGuard = ({
  warningAfterMs: warningAfterMsProp,
  countdownSeconds: countdownSecondsProp,
}: IIdleSessionGuardProps) => {
  const config = useMemo(() => resolveIdleConfig(), []);
  const warningAfterMs = warningAfterMsProp ?? config.warningAfterMs;
  const countdownSeconds = countdownSecondsProp ?? config.warningSeconds;
  const { user, logout } = useAuth();
  const handleTimeout = useCallback(() => {
    void logout("idle");
  }, [logout]);
  const handleLogoutNow = useCallback(() => {
    void logout("logout");
  }, [logout]);

  if (user === null) return null;

  return (
    <IdleWatch
      warningAfterMs={warningAfterMs}
      countdownSeconds={countdownSeconds}
      onTimeout={handleTimeout}
      onLogoutNow={handleLogoutNow}
    />
  );
};
