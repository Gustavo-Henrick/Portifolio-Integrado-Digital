import { Bimestre, Capitulo, Materia, Trabalho } from "../model/index.js";
import { ano, dadosBimestre, erro, uuid } from "./validacao.js";

async function buscarBimestre(id) {
  const bimestre = await Bimestre.findByPk(uuid(id, "id"));
  if (!bimestre) throw erro(404, "Bimestre não encontrado.");
  return bimestre;
}

async function verificarMateria(id) {
  if (!(await Materia.findByPk(id))) throw erro(404, "Matéria não encontrada.");
}

export async function criarBimestre(req, res) {
  const dados = dadosBimestre(req.body, false);
  await verificarMateria(dados.materia_id);
  res.status(201).json(await Bimestre.create({ conteudo: null, ...dados }));
}

export async function listarBimestres(req, res) {
  const where = {};
  if (req.query.materia_id !== undefined) where.materia_id = uuid(req.query.materia_id, "materia_id");
  if (req.query.ano !== undefined) {
    const valor = req.query.ano;
    where.ano = ano(typeof valor === "string" && /^\d{4}$/.test(valor) ? Number(valor) : NaN);
  }

  res.json(await Bimestre.findAll({
    where,
    order: [["ano", "ASC"], ["numero_bimestre", "ASC"], ["id", "ASC"]],
  }));
}

export async function consultarBimestre(req, res) {
  res.json(await buscarBimestre(req.params.id));
}

export async function atualizarBimestre(req, res) {
  const bimestre = await buscarBimestre(req.params.id);
  const dados = dadosBimestre(req.body, true);
  if (dados.materia_id !== undefined) await verificarMateria(dados.materia_id);
  res.json(await bimestre.update(dados));
}

export async function excluirBimestre(req, res) {
  const bimestre = await buscarBimestre(req.params.id);
  const where = { bimestre_id: bimestre.id };
  if (await Capitulo.count({ where }) || await Trabalho.count({ where })) {
    throw erro(409, "O bimestre possui capítulos ou trabalhos vinculados.");
  }
  await bimestre.destroy();
  res.sendStatus(204);
}
