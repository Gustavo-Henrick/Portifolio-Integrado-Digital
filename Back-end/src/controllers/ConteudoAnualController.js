import conn from "../config/conn.js";
import { Materia } from "../model/index.js";
import { ano, erro, texto, textoLongo, uuid, validarCorpo } from "./validacao.js";

const quemSouEu = {
  serie: (valor) => texto(valor, "serie", 80),
  turma: (valor) => texto(valor, "turma", 80),
  itinerario_formativo: (valor) => texto(valor, "itinerario_formativo", 120),
  reflexao_pessoal: (valor) => textoLongo(valor, "reflexao_pessoal"),
};

const reflexaoCritica = {
  aprendizado_academico: (valor) => textoLongo(valor, "aprendizado_academico"),
  aplicacao_pratica: (valor) => textoLongo(valor, "aplicacao_pratica"),
  pontos_a_melhorar: (valor) => textoLongo(valor, "pontos_a_melhorar"),
};

const aprendizados = {
  experiencias: (valor) => textoLongo(valor, "experiencias"),
  aplicacao_dos_conhecimentos: (valor) => textoLongo(valor, "aplicacao_dos_conhecimentos"),
};

const secoes = {
  quem_sou_eu: (valor) => validarCorpo(valor, true, quemSouEu),
  reflexao_critica: (valor) => validarCorpo(valor, true, reflexaoCritica),
  conexoes_interdisciplinares: (valor) => textoLongo(valor, "conexoes_interdisciplinares"),
  aprendizados_para_a_vida: (valor) => validarCorpo(valor, true, aprendizados),
};

function identificar(req) {
  const valor = req.params.ano;
  return {
    id: uuid(req.params.id, "id"),
    anoLetivo: ano(/^\d{4}$/.test(valor) ? Number(valor) : NaN),
  };
}

async function buscarArea(id, options) {
  const materia = await Materia.findByPk(id, options);
  if (!materia) throw erro(404, "Matéria não encontrada.");
  if (materia.instituto !== "SESI") throw erro(400, "O conteúdo anual é destinado às áreas do SESI.");
  return materia;
}

export async function consultarConteudoAnual(req, res) {
  const { id, anoLetivo } = identificar(req);
  const materia = await buscarArea(id);
  res.json({ materia_id: id, ano: anoLetivo, conteudo: materia.conteudo_anual[anoLetivo] ?? {} });
}

export async function atualizarConteudoAnual(req, res) {
  const { id, anoLetivo } = identificar(req);
  const alteracoes = validarCorpo(req.body, true, secoes);
  const conteudo = await conn.transaction(async (transaction) => {
    const materia = await buscarArea(id, { transaction, lock: transaction.LOCK.UPDATE });
    const conteudoAnual = materia.conteudo_anual;
    const atualizado = { ...conteudoAnual[anoLetivo] };

    for (const [secao, valor] of Object.entries(alteracoes)) {
      atualizado[secao] = typeof valor === "object" ? { ...atualizado[secao], ...valor } : valor;
    }

    await materia.update({ conteudo_anual: { ...conteudoAnual, [anoLetivo]: atualizado } }, { transaction });
    return atualizado;
  });

  res.json({ materia_id: id, ano: anoLetivo, conteudo });
}
