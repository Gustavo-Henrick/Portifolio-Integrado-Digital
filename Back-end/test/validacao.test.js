import { describe, expect, it } from "vitest";
import { anexosProjeto, dadosBimestre, imagensTrabalho, registrosSemestre } from "../src/controllers/validacao.js";
import { hashPassword, verifyPassword } from "../src/auth/password.js";

const materiaId = "00000000-0000-4000-8000-000000000001";
const photo = {
  nome: "foto.png", tipo: "image/png",
  dados: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jX1kAAAAASUVORK5CYII=",
};

describe("validação de registros", () => {
  it.each([0, 5, "2"])("rejeita o número de bimestre %s", (numero_bimestre) => {
    expect(() => dadosBimestre({ numero_bimestre, ano: 2026, materia_id: materiaId }, false))
      .toThrow(expect.objectContaining({ status: 400, details: [expect.objectContaining({ field: "numero_bimestre" })] }));
  });

  it("valida a autoavaliação e os links de vídeo de um semestre", () => {
    const records = { autoavaliacao: "Preciso praticar SQL.", videos: ["https://example.test/video"] };
    expect(registrosSemestre(records)).toEqual(records);
  });

  it("rejeita protocolo inválido em links de vídeo", () => {
    expect(() => registrosSemestre({ videos: ["file:///video.mp4"] }))
      .toThrow(expect.objectContaining({ status: 400 }));
  });

  it("aceita a imagem e rejeita tipo de arquivo diferente para evidência", () => {
    expect(imagensTrabalho([photo])).toEqual([photo]);
    expect(() => imagensTrabalho([{ ...photo, tipo: "application/pdf" }]))
      .toThrow(expect.objectContaining({ status: 400 }));
  });

  it("rejeita um anexo com base64 inválido e mais de dez anexos", () => {
    expect(() => anexosProjeto([{ ...photo, dados: "sem base64!" }]))
      .toThrow(expect.objectContaining({ status: 400 }));
    expect(() => anexosProjeto(Array(11).fill(photo)))
      .toThrow(expect.objectContaining({ status: 400 }));
  });
});

it("gera hashes com salts diferentes e valida apenas a senha correspondente", async () => {
  const password = "senha de exemplo para teste";
  const first = await hashPassword(password);
  const second = await hashPassword(password);

  expect(first).not.toBe(second);
  expect(first).not.toContain(password);
  expect(await verifyPassword(password, first)).toBe(true);
  expect(await verifyPassword("outra senha", first)).toBe(false);
}, 15_000);