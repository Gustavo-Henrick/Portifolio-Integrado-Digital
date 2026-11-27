import { DataTypes } from "sequelize";
import conn from "../config/conn.js";

function definirRegistro(nome, tabela, campos, indexes = []) {
  return conn.define(nome, {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    titulo: { type: DataTypes.STRING(120), allowNull: false },
    conteudo: { type: DataTypes.TEXT, allowNull: false },
    ...campos,
  }, {
    tableName: tabela,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes,
  });
}

export const Capitulo = definirRegistro("Capitulo", "capitulos", {
  bimestre_id: { type: DataTypes.UUID, allowNull: false },
  capitulo_numero: { type: DataTypes.INTEGER, allowNull: true },
}, [{
  name: "capitulo_unico_por_bimestre",
  unique: true,
  fields: ["bimestre_id", "capitulo_numero"],
}]);

export const Trabalho = definirRegistro("Trabalho", "trabalhos", {
  evidencias: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
  bimestre_id: { type: DataTypes.UUID, allowNull: false },
});

export const Projeto = definirRegistro("Projeto", "projetos", {
  semestre_id: { type: DataTypes.UUID, allowNull: false },
  conteudo: { type: DataTypes.TEXT, allowNull: true },
  descricao: { type: DataTypes.TEXT, allowNull: true },
  anexos: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
  link_github: { type: DataTypes.STRING(512), allowNull: true },
});
