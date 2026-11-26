import { Router } from "express";
import { Bimestre, Capitulo, Materia, Projeto, Semestre, Trabalho } from "../model/index.js";
import { controllerPortfolio } from "../controllers/PortfolioController.js";
import { ano, erro, inteiro, linkGithub, linksDeEvidencias, texto, textoLongo, uuid } from "../controllers/validacao.js";

const numeroCapitulo = (valor) => inteiro(valor, "capitulo_numero", 1, 2_147_483_647);
const numeroNaUrl = (valor) => typeof valor === "string" && /^\d+$/.test(valor) ? Number(valor) : NaN;
const camposRegistro = {
  titulo: (valor) => texto(valor, "titulo", 120),
  conteudo: (valor) => textoLongo(valor, "conteudo"),
};

function rotasCRUD(controller) {
  const router = Router();
  router.route("/").get(controller.listar).post(controller.criar);
  router.route("/:id").get(controller.consultar).put(controller.atualizar).delete(controller.excluir);
  return router;
}

const capitulos = controllerPortfolio({
  model: Capitulo, nome: "Capítulo", pai: Bimestre, chave: "bimestre_id",
  campos: camposRegistro,
  opcionais: { capitulo_numero: (valor) => valor === null ? null : numeroCapitulo(valor) },
  order: [["capitulo_numero", "ASC"], ["created_at", "ASC"], ["id", "ASC"]],
});

const trabalhos = controllerPortfolio({
  model: Trabalho, nome: "Trabalho", pai: Bimestre, chave: "bimestre_id",
  campos: camposRegistro,
  opcionais: { evidencias: linksDeEvidencias },
  order: [["created_at", "ASC"], ["id", "ASC"]],
});

const semestres = controllerPortfolio({
  model: Semestre, nome: "Semestre", pai: Materia, chave: "materia_id",
  campos: {
    numero_semestre: (valor) => inteiro(valor, "numero_semestre", 1, 2),
    ano,
  },
  filtros: { ano: (valor) => ano(numeroNaUrl(valor)) },
  order: [["ano", "ASC"], ["numero_semestre", "ASC"], ["id", "ASC"]],
  dependencias: [[Projeto, "semestre_id"]],
});

const projetos = controllerPortfolio({
  model: Projeto, nome: "Projeto", pai: Semestre, chave: "semestre_id",
  campos: { titulo: camposRegistro.titulo },
  opcionais: {
    conteudo: (valor) => textoLongo(valor, "conteudo", true),
    descricao: (valor) => textoLongo(valor, "descricao", true),
    link_github: linkGithub,
  },
  order: [["created_at", "ASC"], ["id", "ASC"]],
});

const router = Router();
router.use("/capitulos", rotasCRUD(capitulos));
router.use("/trabalhos", rotasCRUD(trabalhos));
router.use("/semestres/projetos", rotasCRUD(projetos));
router.use("/semestres", rotasCRUD(semestres));
router.use("/projetos", rotasCRUD(projetos));

router.post("/bimestre/capitulo", capitulos.criar);
router.post("/bimestre/trabalho", trabalhos.criar);
router.post("/semestre/projeto", projetos.criar);
router.get("/bimestre/capitulo/:capitulo_numero", async (req, res) => {
  const where = { capitulo_numero: numeroCapitulo(numeroNaUrl(req.params.capitulo_numero)) };
  if (req.query.bimestre_id !== undefined) where.bimestre_id = uuid(req.query.bimestre_id, "bimestre_id");

  const registros = await Capitulo.findAll({ where, limit: 2 });
  if (!registros.length) throw erro(404, "Capítulo não encontrado.");
  if (registros.length > 1) throw erro(409, "Informe bimestre_id para identificar o capítulo.");
  res.json(registros[0]);
});

export default router;
