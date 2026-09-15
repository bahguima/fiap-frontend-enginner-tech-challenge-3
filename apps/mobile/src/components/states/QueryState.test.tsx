import { fireEvent, screen } from "@testing-library/react-native";

import { renderWithTheme } from "@mobile/test/render";
import { QueryState } from "./QueryState";

describe("QueryState", () => {
  it.each([
    ["loading", "Carregando dados"],
    ["empty", "Nenhum dado encontrado"],
    ["success", "Dados disponíveis"],
  ] as const)("renderiza o estado %s", (kind, message) => {
    renderWithTheme(<QueryState kind={kind} message={message} />);

    expect(screen.getByText(message)).toBeOnTheScreen();
  });

  it("expõe o erro e permite tentar novamente", () => {
    const onRetry = jest.fn();
    renderWithTheme(
      <QueryState
        kind="error"
        message="Não foi possível carregar."
        onRetry={onRetry}
      />,
    );

    fireEvent.press(screen.getByRole("button", { name: "Tentar novamente" }));

    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Não foi possível carregar.")).toBeOnTheScreen();
  });
});
