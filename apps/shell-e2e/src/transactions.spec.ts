import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

/**
 * Controle das respostas do MSW no navegador. Os handlers já entendem os
 * headers `x-mock-delay-ms` e `x-mock-error`; o teste os injeta somente nas
 * requisições de transações do método escolhido. Como o MSW roda no service
 * worker, `page.route` não intercepta essas chamadas.
 */
interface MockControl {
  method: "POST" | "PUT" | "DELETE";
  delayMs: number;
  error?: boolean;
}

declare global {
  interface Window {
    __transactionsMockControl?: MockControl | null;
  }
}

const SLOW_API_DELAY_MS = 3000;

async function installMockControl(page: Page) {
  await page.addInitScript(() => {
    window.__transactionsMockControl = null;
    const originalFetch = window.fetch.bind(window);

    window.fetch = (input, init = {}) => {
      const control = window.__transactionsMockControl;
      const method = (init.method ?? "GET").toUpperCase();
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.href
            : input.url;

      if (control?.method === method && url.includes("/api/transactions")) {
        const headers = new Headers(init.headers);
        headers.set("x-mock-delay-ms", String(control.delayMs));
        if (control.error) headers.set("x-mock-error", "true");
        return originalFetch(input, { ...init, headers });
      }

      return originalFetch(input, init);
    };
  });
}

const setMockControl = (page: Page, control: MockControl) =>
  page.evaluate((value) => {
    window.__transactionsMockControl = value;
  }, control);

async function abrirExtrato(page: Page) {
  await installMockControl(page);
  await page.goto("/login");
  await page.getByLabel("E-mail").fill("email@teste.com");
  await page.getByLabel("Senha").fill("123");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.getByRole("link", { name: "Extrato" }).click();
  await expect(page.getByRole("heading", { name: "Extrato" })).toBeVisible();
  await expect(celula(page, "Assinatura de streaming")).toBeVisible();
}

const celula = (page: Page, texto: string) =>
  page.locator("table td", { hasText: texto });

async function abrirAcao(page: Page, descricao: string, acao: string) {
  await page.getByRole("button", { name: `Ações para ${descricao}` }).click();
  await page.getByRole("menuitem", { name: acao }).click();
}

test.describe("Atualização otimista de transações no extrato federado", () => {
  test("exibe a nova transação antes da resposta da API", async ({ page }) => {
    await abrirExtrato(page);
    await setMockControl(page, { method: "POST", delayMs: SLOW_API_DELAY_MS });

    await page.getByRole("button", { name: "Nova Transação" }).click();
    const formulario = page.getByRole("dialog");
    await formulario.getByLabel("Descrição").fill("Bônus otimista");
    await formulario.getByRole("combobox", { name: "Categoria" }).click();
    await page.getByRole("option", { name: "Depósito" }).click();
    await formulario.getByLabel("Valor").fill("321.45");
    await formulario.getByRole("button", { name: "Criar transação" }).click();

    // A linha aparece enquanto o envio ainda está pendente.
    await expect(celula(page, "Bônus otimista")).toBeVisible();
    await expect(formulario).toHaveAttribute("aria-busy", "true");

    // Após a resposta, o dado da API substitui o provisório.
    await expect(formulario).toBeHidden({ timeout: SLOW_API_DELAY_MS * 3 });
    await expect(celula(page, "Bônus otimista")).toBeVisible();
    await expect(celula(page, "+R$ 321,45")).toBeVisible();
  });

  test("aplica a edição antes da resposta da API", async ({ page }) => {
    await abrirExtrato(page);
    await setMockControl(page, { method: "PUT", delayMs: SLOW_API_DELAY_MS });

    await abrirAcao(page, "Assinatura de streaming", "Editar");
    const formulario = page.getByRole("dialog");
    await formulario.getByLabel("Descrição").fill("Streaming editado");
    await formulario.getByRole("button", { name: "Salvar alterações" }).click();

    await expect(celula(page, "Streaming editado")).toBeVisible();
    await expect(formulario).toHaveAttribute("aria-busy", "true");

    await expect(formulario).toBeHidden({ timeout: SLOW_API_DELAY_MS * 3 });
    await expect(celula(page, "Streaming editado")).toBeVisible();
    await expect(celula(page, "Assinatura de streaming")).toHaveCount(0);
  });

  test("desfaz a exclusão otimista quando a API falha", async ({ page }) => {
    await abrirExtrato(page);
    await setMockControl(page, {
      method: "DELETE",
      delayMs: SLOW_API_DELAY_MS,
      error: true,
    });

    await abrirAcao(page, "Assinatura de streaming", "Excluir");
    const confirmacao = page.getByRole("dialog");
    await confirmacao.getByRole("button", { name: "Excluir" }).click();

    // Removida otimisticamente enquanto a exclusão está pendente.
    await expect(celula(page, "Assinatura de streaming")).toHaveCount(0);
    await expect(confirmacao).toHaveAttribute("aria-busy", "true");

    // Rollback: a API falha, a linha volta e o erro é exibido.
    await expect(confirmacao.getByRole("alert")).toHaveText(
      "Erro simulado pela infraestrutura de mocks.",
      { timeout: SLOW_API_DELAY_MS * 3 },
    );
    await expect(celula(page, "Assinatura de streaming")).toBeVisible();
  });
});
