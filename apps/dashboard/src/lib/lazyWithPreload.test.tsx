import { Suspense } from "react";
import { render, screen } from "@testing-library/react";
import { lazyWithPreload } from "./lazyWithPreload";

const Loaded = () => <p>Conteúdo carregado</p>;

describe("lazyWithPreload", () => {
  it("compartilha o mesmo import entre preload e renderização", async () => {
    const factory = jest.fn(async () => ({ default: Loaded }));
    const LazyComponent = lazyWithPreload(factory);

    await LazyComponent.preload();
    render(
      <Suspense fallback={<p role="status">Carregando...</p>}>
        <LazyComponent />
      </Suspense>,
    );

    expect(await screen.findByText("Conteúdo carregado")).toBeInTheDocument();
    expect(factory).toHaveBeenCalledTimes(1);
  });

  it("mostra o fallback do Suspense até o chunk resolver", async () => {
    const LazyComponent = lazyWithPreload(async () => ({ default: Loaded }));

    render(
      <Suspense fallback={<p role="status">Carregando...</p>}>
        <LazyComponent />
      </Suspense>,
    );

    expect(screen.getByRole("status")).toHaveTextContent("Carregando...");
    expect(await screen.findByText("Conteúdo carregado")).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("permite nova tentativa após uma falha de rede", async () => {
    const factory = jest
      .fn<Promise<{ default: typeof Loaded }>, []>()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce({ default: Loaded });
    const LazyComponent = lazyWithPreload(factory);

    await expect(LazyComponent.preload()).rejects.toThrow("offline");
    await expect(LazyComponent.preload()).resolves.toEqual({
      default: Loaded,
    });
    expect(factory).toHaveBeenCalledTimes(2);
  });
});
