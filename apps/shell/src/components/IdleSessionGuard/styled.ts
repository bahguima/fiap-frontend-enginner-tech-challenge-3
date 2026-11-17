import * as AlertDialog from "@radix-ui/react-alert-dialog";
import styled from "styled-components";
// As variáveis CSS vêm do estilo global dos remotes; os valores após a vírgula
// são o fallback (tema claro).
export const Overlay = styled(AlertDialog.Overlay)`
  position: fixed;
  inset: 0;
  z-index: 60;
  background: hsl(var(--foreground, 215 30% 12%) / 0.72);
`;

export const Content = styled(AlertDialog.Content)`
  position: fixed;
  top: 50%;
  left: 50%;
  z-index: 61;
  display: grid;
  gap: 0.75rem;
  width: calc(100% - 2rem);
  max-width: 28rem;
  transform: translate(-50%, -50%);
  border: 1px solid hsl(var(--border, 210 18% 87%));
  border-radius: var(--radius, 0.75rem);
  background: hsl(var(--popover, 0 0% 100%));
  color: hsl(var(--popover-foreground, 215 30% 12%));
  padding: 1.5rem;
  box-shadow: 0 20px 50px rgb(15 23 42 / 0.24);
  outline: none;
`;

export const Title = styled(AlertDialog.Title)`
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
`;

export const Description = styled(AlertDialog.Description)`
  margin: 0;
  line-height: 1.5;
`;

export const Countdown = styled.span`
  font-variant-numeric: tabular-nums;
  font-weight: 700;
`;

export const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 0.5rem;
`;

const buttonBase = `
  min-height: 2.5rem;
  padding: 0.5rem 1rem;
  border-radius: calc(var(--radius, 0.75rem) - 4px);
  font: inherit;
  font-weight: 600;
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid hsl(var(--ring, 182 80% 36%));
    outline-offset: 2px;
  }
`;

export const PrimaryButton = styled.button`
  ${buttonBase}
  border: 0;
  background: hsl(var(--primary, 182 80% 36%));
  color: hsl(var(--primary-foreground, 0 0% 100%));
`;

export const SecondaryButton = styled.button`
  ${buttonBase}
  border: 1px solid hsl(var(--border, 210 18% 87%));
  background: transparent;
  color: hsl(var(--destructive, 0 72% 42%));
`;
