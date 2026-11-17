import { motion } from "framer-motion";
import styled from "styled-components";
import { Button } from "@banking/shared/ui/components/button";
import { Input } from "@banking/shared/ui/components/input";
import { GlassSurface } from "@banking/shared/ui/styles/shared";

export const LoginRoot = styled.div`
  position: relative;
  display: flex;
  min-height: 100vh;
  align-items: center;
  justify-content: center;
  padding: 0 1rem;
`;

export const GlowLayer = styled.div`
  pointer-events: none;
  position: absolute;
  inset: 0;
`;

const GlowBase = styled.div`
  position: absolute;
  border-radius: 50%;
  filter: blur(120px);
`;

export const PrimaryGlow = styled(GlowBase)`
  top: 33%;
  left: 33%;
  width: 24rem;
  height: 24rem;
  background: hsl(var(--primary) / 0.08);
`;

export const AccentGlow = styled(GlowBase)`
  right: 33%;
  bottom: 33%;
  width: 20rem;
  height: 20rem;
  background: hsl(var(--accent) / 0.08);
`;

export const LanguageActions = styled.div`
  position: absolute;
  top: 1rem;
  right: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

export const LoginCardMotion = styled(motion.div)`
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 28rem;
`;

export const LoginHeader = styled.div`
  margin-bottom: 2rem;
  text-align: center;
`;

export const Title = styled.h1`
  margin: 1.5rem 0 0;
  font-family: "Space Grotesk", sans-serif;
  font-size: 1.25rem;
  font-weight: 600;
`;

export const Subtitle = styled.p`
  margin: 0.25rem 0 0;
  color: hsl(var(--muted-foreground));
  font-size: 0.875rem;
`;

export const FormPanel = styled(GlassSurface)`
  border-radius: var(--radius);
  padding: 1.5rem;

  @media (min-width: 768px) {
    padding: 2rem;
  }
`;

export const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;

export const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

export const MutedInput = styled(Input)`
  background: hsl(var(--background) / 0.5);
`;

export const ErrorMessage = styled.p`
  margin: 0;
  color: hsl(var(--destructive));
  font-size: 0.875rem;
`;

export const SessionNotice = styled.p`
  margin: 0;
  padding: 0.5rem 0.75rem;
  border: 1px solid hsl(var(--border));
  border-radius: calc(var(--radius) - 4px);
  background: hsl(var(--muted));
  color: hsl(var(--foreground));
  font-size: 0.875rem;
`;

export const SubmitButton = styled(Button)`
  width: 100%;
`;

export const DemoText = styled.p`
  margin: 1rem 0 0;
  color: hsl(var(--muted-foreground));
  font-size: 0.75rem;
  text-align: center;
`;

export const BackArea = styled.div`
  margin-top: 1.5rem;
  text-align: center;
`;

export const BackLink = styled.a`
  color: hsl(var(--muted-foreground));
  font-size: 0.875rem;
  transition: color 160ms ease;

  &:hover {
    color: hsl(var(--foreground));
  }
`;
