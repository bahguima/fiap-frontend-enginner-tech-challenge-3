import { createAttachmentListSchema } from "./attachments";

describe("política de anexos", () => {
  it("aceita metadados independentes de plataforma", () => {
    const result = createAttachmentListSchema().safeParse([
      { name: "recibo.pdf", mimeType: "application/pdf", sizeInBytes: 2048 },
    ]);
    expect(result.success).toBe(true);
  });

  it("rejeita MIME, tamanho e quantidade fora da política", () => {
    expect(createAttachmentListSchema().safeParse([
      { name: "dados.csv", mimeType: "text/csv", sizeInBytes: 10 },
    ]).success).toBe(false);
    expect(createAttachmentListSchema().safeParse([
      { name: "grande.pdf", mimeType: "application/pdf", sizeInBytes: 5 * 1024 * 1024 + 1 },
    ]).success).toBe(false);
    expect(createAttachmentListSchema().safeParse([
      { name: "vazio.pdf", mimeType: "application/pdf", sizeInBytes: 0 },
    ]).success).toBe(false);
    expect(createAttachmentListSchema(5).safeParse([
      { name: "extra.pdf", mimeType: "application/pdf", sizeInBytes: 10 },
    ]).success).toBe(false);
  });
});
