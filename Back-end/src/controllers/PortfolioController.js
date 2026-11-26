import { erro, uuid, validarCorpo } from "./validacao.js";

export function controllerPortfolio({ model, nome, pai, chave, campos, opcionais, filtros, order, dependencias = [] }) {
  async function buscar(id) {
    const registro = await model.findByPk(uuid(id, "id"));
    if (!registro) throw erro(404, nome + " não encontrado.");
    return registro;
  }

  async function validarPai(dados) {
    if (dados[chave] !== undefined && !(await pai.findByPk(dados[chave]))) {
      throw erro(404, "Registro vinculado não encontrado.");
    }
  }

  const validar = (body, parcial) => validarCorpo(body, parcial, {
    ...campos,
    [chave]: (valor) => uuid(valor, chave),
  }, opcionais);

  return {
    async criar(req, res) {
      const dados = validar(req.body, false);
      await validarPai(dados);
      res.status(201).json(await model.create(dados));
    },

    async listar(req, res) {
      const where = {};
      if (req.query[chave] !== undefined) where[chave] = uuid(req.query[chave], chave);
      for (const [campo, validarFiltro] of Object.entries(filtros || {})) {
        if (req.query[campo] !== undefined) where[campo] = validarFiltro(req.query[campo]);
      }
      res.json(await model.findAll({ where, order }));
    },

    async consultar(req, res) {
      res.json(await buscar(req.params.id));
    },

    async atualizar(req, res) {
      const registro = await buscar(req.params.id);
      const dados = validar(req.body, true);
      await validarPai(dados);
      res.json(await registro.update(dados));
    },

    async excluir(req, res) {
      const registro = await buscar(req.params.id);
      for (const [dependente, fk] of dependencias) {
        if (await dependente.count({ where: { [fk]: registro.id } })) {
          throw erro(409, nome + " possui registros vinculados.");
        }
      }
      await registro.destroy();
      res.sendStatus(204);
    },
  };
}
