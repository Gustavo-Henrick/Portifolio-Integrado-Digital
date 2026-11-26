import { Bimestre, Materia, Semestre } from "../model/index.js";
import { dadosMateria, erro, instituto, uuid } from "./validacao.js";

async function buscarMateria(id) {
  const materia = await Materia.findByPk(uuid(id, "id"));
  if (!materia) throw erro(404, "Matéria não encontrada.");
  return materia;
}

export async function criarMateria(req, res) {
  const materia = await Materia.create(dadosMateria(req.body, false));
  res.status(201).json(materia);
}

export async function listarMaterias(req, res) {
  const where = {};
  if (req.query.instituto !== undefined) where.instituto = instituto(req.query.instituto);
  res.json(await Materia.findAll({ where, order: [["nome", "ASC"], ["id", "ASC"]] }));
}

export async function consultarMateria(req, res) {
  res.json(await buscarMateria(req.params.id));
}

export async function atualizarMateria(req, res) {
  const materia = await buscarMateria(req.params.id);
  res.json(await materia.update(dadosMateria(req.body, true)));
}

export async function excluirMateria(req, res) {
  const materia = await buscarMateria(req.params.id);
  if (await Bimestre.count({ where: { materia_id: materia.id } })) {
    throw erro(409, "A matéria possui bimestres vinculados.");
  }
  if (await Semestre.count({ where: { materia_id: materia.id } })) {
    throw erro(409, "A matéria possui semestres vinculados.");
  }
  await materia.destroy();
  res.sendStatus(204);
}
