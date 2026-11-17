"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { LanguageSelector } from "@institutional/components/LanguageSelector";
import { Label } from "@banking/shared/ui/components/label";
import { useAuth, type LoginResult } from "@banking/shared/auth";
import { useLanguage } from "@institutional/contexts/LanguageContext";
import { BrandLinkText } from "@banking/shared/ui/styles/shared";

import {
  AccentGlow,
  BackArea,
  BackLink,
  DemoText,
  ErrorMessage,
  SessionNotice,
  Field,
  Form,
  FormPanel,
  GlowLayer,
  LanguageActions,
  LoginCardMotion,
  LoginHeader,
  LoginRoot,
  MutedInput,
  PrimaryGlow,
  SubmitButton,
  Subtitle,
  Title,
} from "./styled";

type LoginFailure = Exclude<LoginResult, { status: "authenticated" }>;

function useLoginFailureMessage(failure: LoginFailure | null) {
  const { t } = useLanguage();
  if (failure === null) return null;

  if (failure.status === "locked") {
    const minutes = Math.max(1, Math.ceil(failure.retryAfterSeconds / 60));
    return t("login.locked").replace("{n}", String(minutes));
  }

  if (failure.status === "invalid-credentials") {
    const attempts =
      failure.remainingAttempts !== null
        ? ` ${t("login.attempts").replace("{n}", String(failure.remainingAttempts))}`
        : "";
    return `${t("login.error")}.${attempts}`;
  }

  return t("login.unavailable");
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [failure, setFailure] = useState<LoginFailure | null>(null);
  const errorMessage = useLoginFailureMessage(failure);
  const error = failure !== null;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, sessionEndReason } = useAuth();
  const { t } = useLanguage();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    const result = await login(email, password);
    setIsSubmitting(false);

    if (result.status === "authenticated") {
      window.history.pushState({}, "", "/dashboard");
      window.dispatchEvent(new PopStateEvent("popstate"));
    } else {
      setFailure(result);
    }
  };

  return (
    <LoginRoot>
      <GlowLayer aria-hidden="true">
        <PrimaryGlow />
        <AccentGlow />
      </GlowLayer>

      <LanguageActions>
        <LanguageSelector />
      </LanguageActions>

      <LoginCardMotion
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <LoginHeader>
          <a href="/">
            <BrandLinkText>ByteBank</BrandLinkText>
          </a>
          <Title>{t("login.title")}</Title>
          <Subtitle>{t("login.subtitle")}</Subtitle>
        </LoginHeader>

        <FormPanel>
          <Form onSubmit={handleSubmit} aria-busy={isSubmitting}>
            <Field>
              <Label htmlFor="email">{t("login.email")}</Label>
              <MutedInput
                id="email"
                type="email"
                aria-invalid={error}
                aria-describedby={error ? "login-error" : undefined}
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setFailure(null);
                }}
                placeholder="email@teste.com"
              />
            </Field>
            <Field>
              <Label htmlFor="password">{t("login.password")}</Label>
              <MutedInput
                id="password"
                type="password"
                aria-invalid={error}
                aria-describedby={error ? "login-error" : undefined}
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setFailure(null);
                }}
                placeholder="123"
              />
            </Field>

            {sessionEndReason === "idle" && !error && (
              <SessionNotice role="status">
                {t("login.sessionIdle")}
              </SessionNotice>
            )}

            {errorMessage && (
              <ErrorMessage id="login-error" role="alert">
                {errorMessage}
              </ErrorMessage>
            )}

            <SubmitButton type="submit" disabled={isSubmitting}>
              {t("login.button")}
            </SubmitButton>
          </Form>

          <DemoText>{t("login.demo")}</DemoText>
        </FormPanel>

        <BackArea>
          <BackLink href="/">{t("login.back")}</BackLink>
        </BackArea>
      </LoginCardMotion>
    </LoginRoot>
  );
}
