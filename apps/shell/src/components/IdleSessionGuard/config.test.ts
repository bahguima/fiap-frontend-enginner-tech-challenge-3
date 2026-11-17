import { resolveIdleConfig } from "./config";

describe("resolveIdleConfig", () => {
  it("usa 600 s de timeout e 60 s de aviso por padrão", () => {
    expect(resolveIdleConfig({})).toEqual({
      timeoutSeconds: 600,
      warningSeconds: 60,
      warningAfterMs: 540_000,
    });
  });

  it("aceita valores válidos (ex.: demonstração com 30 s e aviso de 10 s)", () => {
    expect(resolveIdleConfig({ timeout: "30", warning: "10" })).toEqual({
      timeoutSeconds: 30,
      warningSeconds: 10,
      warningAfterMs: 20_000,
    });
  });

  it.each(["", "0", "1", "-10", "abc", "1.5", "30s"])(
    "timeout inválido %p cai no padrão",
    (timeout) => {
      expect(resolveIdleConfig({ timeout, warning: "10" }).timeoutSeconds).toBe(600);
    },
  );

  it.each(["", "0", "-1", "abc", "2.5"])("aviso inválido %p cai no padrão", (warning) => {
    expect(resolveIdleConfig({ timeout: "600", warning }).warningSeconds).toBe(60);
  });

  it("aviso maior ou igual ao timeout é inválido; com timeout curto usa metade", () => {
    expect(resolveIdleConfig({ timeout: "600", warning: "600" }).warningSeconds).toBe(60);
    expect(resolveIdleConfig({ timeout: "30", warning: "45" })).toMatchObject({
      timeoutSeconds: 30,
      warningSeconds: 15,
      warningAfterMs: 15_000,
    });
  });

  it("lê as variáveis de ambiente NEXT_PUBLIC_IDLE_*", () => {
    const previous = {
      timeout: process.env.NEXT_PUBLIC_IDLE_TIMEOUT_SECONDS,
      warning: process.env.NEXT_PUBLIC_IDLE_WARNING_SECONDS,
    };
    process.env.NEXT_PUBLIC_IDLE_TIMEOUT_SECONDS = "45";
    process.env.NEXT_PUBLIC_IDLE_WARNING_SECONDS = "5";

    expect(resolveIdleConfig()).toEqual({
      timeoutSeconds: 45,
      warningSeconds: 5,
      warningAfterMs: 40_000,
    });

    process.env.NEXT_PUBLIC_IDLE_TIMEOUT_SECONDS = previous.timeout;
    process.env.NEXT_PUBLIC_IDLE_WARNING_SECONDS = previous.warning;
    if (previous.timeout === undefined) delete process.env.NEXT_PUBLIC_IDLE_TIMEOUT_SECONDS;
    if (previous.warning === undefined) delete process.env.NEXT_PUBLIC_IDLE_WARNING_SECONDS;
  });
});
