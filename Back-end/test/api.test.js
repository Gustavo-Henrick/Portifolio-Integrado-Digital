import { once } from "node:events";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { Materia, Projeto, Semestre, Sessao, Trabalho } from "../src/model/index.js";

vi.mock("../src/config/conn.js", () => ({ default: {} }));
vi.mock("../src/model/index.js", () => ({
  Bimestre: {},
  Capitulo: {},
  Materia: { findAll: vi.fn(), create: vi.fn() },
  Projeto: { findAll: vi.fn(), findByPk: vi.fn() },
  Semestre: { findByPk: vi.fn() },
  Sessao: { findOne: vi.fn() },
  Trabalho: { findByPk: vi.fn() },
  Usuario: {},
}));

const materiaId = "00000000-0000-4000-8000-000000000001";
const semestreId = "00000000-0000-4000-8000-000000000002";
const projetoId = "00000000-0000-4000-8000-000000000003";
const trabalhoId = "00000000-0000-4000-8000-000000000004";
const materia = { id: materiaId, nome: "Banco de Dados", instituto: "SENAI" };

let server;
let base;

beforeAll(async () => {
  vi.stubEnv("NODE_ENV", "test");
  vi.stubEnv("PORTFOLIO_LOCAL_ACCESS", "true");
  const { default: app } = await import("../src/app.js");
  server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  base = `http://127.0.0.1:${server.address().port}`;
});

afterAll(async () => {
  if (server?.listening) await new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  });
  vi.unstubAllEnvs();
});

beforeEach(() => vi.resetAllMocks());

function write(path, { method = "POST", body, cookie, origin = base, header = true } = {}) {
  return fetch(base + path, {
    method,
    headers: {
      Origin: origin,
      ...(header && { "X-Portfolio-Request": "1" }),
      ...(body && { "Content-Type": "application/json" }),
      ...(cookie && { Cookie: cookie }),
    },
    ...(body && { body: JSON.stringify(body) }),
  });
}

async function openLocalSession() {
  const response = await write("/usuarios/entrada-local");
  expect(response.status).toBe(200);
  const cookie = response.headers.get("set-cookie");
  expect(cookie).toContain("HttpOnly");
  expect(cookie).toContain("SameSite=Strict");
  return cookie.split(";")[0];
}

describe("consultas públicas", () => {
  it("lista as matérias do instituto selecionado", async () => {
    Materia.findAll.mockResolvedValue([materia]);
    const response = await fetch(base + "/materias?instituto=SENAI");

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([materia]);
    expect(Materia.findAll).toHaveBeenCalledWith({
      where: { instituto: "SENAI" }, order: [["nome", "ASC"], ["id", "ASC"]],
    });
  });

  it("rejeita instituto inválido antes de consultar os dados", async () => {
    const response = await fetch(base + "/materias?instituto=OUTRO");

    expect(response.status).toBe(400);
    expect((await response.json()).details[0].field).toBe("instituto");
    expect(Materia.findAll).not.toHaveBeenCalled();
  });

  it("lista projetos pelo semestre sem carregar anexos", async () => {
    const project = { id: projetoId, titulo: "Portfólio" };
    Projeto.findAll.mockResolvedValue([project]);

    const response = await fetch(`${base}/projetos?semestre_id=${semestreId}`);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([project]);
    expect(Projeto.findAll).toHaveBeenCalledWith(expect.objectContaining({
      where: { semestre_id: semestreId }, attributes: { exclude: ["anexos"] },
    }));
  });
});

describe("sessão e gravações", () => {
  it("nega gravação sem sessão e sem cabeçalho de proteção", async () => {
    expect((await write("/materias", { body: materia })).status).toBe(401);
    const cookie = await openLocalSession();
    expect((await write("/materias", { body: materia, cookie, header: false })).status).toBe(403);
    expect(Materia.create).not.toHaveBeenCalled();
  });

  it("rejeita entrada local com origem externa", async () => {
    const response = await write("/usuarios/entrada-local", { origin: "https://example.test" });
    expect(response.status).toBe(404);
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("cria matéria com sessão válida e normaliza o nome", async () => {
    const cookie = await openLocalSession();
    Materia.create.mockResolvedValue(materia);
    const response = await write("/materias", { cookie, body: { nome: " Banco de Dados ", instituto: "SENAI" } });

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual(materia);
    expect(Materia.create).toHaveBeenCalledWith({ nome: "Banco de Dados", instituto: "SENAI" });
  });

  it("rejeita matéria sem nome sem tentar salvá-la", async () => {
    const cookie = await openLocalSession();
    const response = await write("/materias", { cookie, body: { instituto: "SENAI" } });

    expect(response.status).toBe(400);
    expect((await response.json()).details[0].field).toBe("nome");
    expect(Materia.create).not.toHaveBeenCalled();
  });

  it("atualiza os registros de um semestre existente", async () => {
    const cookie = await openLocalSession();
    const changes = { registros_portfolio: { competencias: "Consultas SQL", videos: ["https://example.test/aula"] } };
    const update = vi.fn().mockResolvedValue({ id: semestreId, ...changes });
    Semestre.findByPk.mockResolvedValue({ id: semestreId, update });

    const response = await write(`/semestres/${semestreId}`, { method: "PUT", cookie, body: changes });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ id: semestreId, ...changes });
    expect(update).toHaveBeenCalledWith(changes);
  });

  it("exclui atividade do SESI pela rota de trabalhos", async () => {
    const cookie = await openLocalSession();
    const destroy = vi.fn().mockResolvedValue(undefined);
    Trabalho.findByPk.mockResolvedValue({ destroy });

    const response = await write(`/trabalhos/${trabalhoId}`, { method: "DELETE", cookie });

    expect(response.status).toBe(204);
    expect(Trabalho.findByPk).toHaveBeenCalledWith(trabalhoId);
    expect(destroy).toHaveBeenCalledOnce();
  });

  it("retorna 404 ao tentar excluir projeto inexistente", async () => {
    const cookie = await openLocalSession();
    Projeto.findByPk.mockResolvedValue(null);
    const response = await write(`/projetos/${projetoId}`, { method: "DELETE", cookie });

    expect(response.status).toBe(404);
    expect((await response.json()).message).toMatch(/Projeto não encontrado/);
  });

  it("invalida a sessão local após sair", async () => {
    const cookie = await openLocalSession();
    const loggedIn = await fetch(base + "/usuarios/me", { headers: { Cookie: cookie } });
    expect(loggedIn.status).toBe(200);

    expect((await write("/usuarios/logout", { cookie })).status).toBe(204);
    Sessao.findOne.mockResolvedValue(null);
    const afterLogout = await fetch(base + "/usuarios/me", { headers: { Cookie: cookie } });
    expect(afterLogout.status).toBe(401);
  });
});