import { safeAttachmentName } from "./FirebaseAttachmentsRepository";

describe("FirebaseAttachmentsRepository", () => {
  it("gera nomes seguros preservando uma extensão permitida", () => {
    expect(safeAttachmentName("Comprovante cartão (setembro).PDF")).toBe(
      "Comprovante-cartao-setembro.pdf",
    );
    expect(safeAttachmentName("🔥.png")).toBe("comprovante.png");
    expect(safeAttachmentName(`${"a".repeat(300)}.jpeg`).length).toBeLessThanOrEqual(
      120,
    );
  });
});
