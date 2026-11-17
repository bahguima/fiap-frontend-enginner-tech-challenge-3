import { authApi, authSession, profileApi } from "@banking/shared/api-client";
import {
  DEFAULT_ACCESS_TOKEN_TTL_SECONDS,
  resolveAccessTokenTtlSeconds,
} from "../mocks/authState";
import { server } from "../mocks/server";
import { signOutTestSession } from "../testSession";

const TTL_VARIABLE = "NEXT_PUBLIC_API_MOCK_ACCESS_TOKEN_TTL_SECONDS";

describe("vida do access token configurável (MSW)", () => {
  const original = process.env[TTL_VARIABLE];

  afterEach(() => {
    if (original === undefined) delete process.env[TTL_VARIABLE];
    else process.env[TTL_VARIABLE] = original;
    jest.restoreAllMocks();
  });

  it("aceita inteiros positivos e cai no padrão (300 s) para valores inválidos", () => {
    expect(DEFAULT_ACCESS_TOKEN_TTL_SECONDS).toBe(300);
    expect(resolveAccessTokenTtlSeconds("30")).toBe(30);
    expect(resolveAccessTokenTtlSeconds(" 45 ")).toBe(45);

    for (const invalid of [undefined, "", "0", "-5", "1.5", "abc", "30s"]) {
      expect(resolveAccessTokenTtlSeconds(invalid)).toBe(300);
    }
  });

  it("emite tokens com o TTL da variável e renova quando ele vence", async () => {
    process.env[TTL_VARIABLE] = "30";
    signOutTestSession();
    const grantSpy = jest.spyOn(authSession, "applyGrant");

    await authApi.login({ email: "email@teste.com", password: "123" });
    expect(grantSpy.mock.calls[0][0].expiresIn).toBe(30);

    // 29 s depois o token ainda vale; aos 31 s, o 401 dispara o refresh.
    const startedAt = Date.now();
    const clock = jest.spyOn(Date, "now").mockReturnValue(startedAt + 29_000);
    const refreshes: string[] = [];
    const listener = ({ request }: { request: Request }) => {
      if (request.url.endsWith("/api/auth/refresh")) refreshes.push(request.url);
    };
    server.events.on("request:start", listener);

    await profileApi.get();
    expect(refreshes).toHaveLength(0);

    clock.mockReturnValue(startedAt + 31_000);
    await expect(profileApi.get()).resolves.toMatchObject({ name: "Fulano" });
    server.events.removeListener("request:start", listener);

    expect(refreshes).toHaveLength(1);
    expect(grantSpy.mock.calls.at(-1)?.[0].expiresIn).toBe(30);
  });

  it("usa 300 s quando a variável é inválida", async () => {
    process.env[TTL_VARIABLE] = "trinta";
    signOutTestSession();
    const grantSpy = jest.spyOn(authSession, "applyGrant");

    await authApi.login({ email: "email@teste.com", password: "123" });

    expect(grantSpy.mock.calls[0][0].expiresIn).toBe(300);
  });
});
