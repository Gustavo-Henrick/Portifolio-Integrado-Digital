import { DataTypes } from "sequelize";
import conn from "../config/conn.js";

const Bimestre = conn.define("Bimestre", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  numero_bimestre: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { isInt: true, min: 1, max: 4 },
  },
  ano: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { isInt: true, min: 2020, max: 2026 },
  },
  materia_id: { type: DataTypes.UUID, allowNull: false },
  participacao: { type: DataTypes.JSONB, allowNull: true },
  conteudo: { type: DataTypes.TEXT, allowNull: true },
}, {
  tableName: "bimestres",
  createdAt: "created_at",
  updatedAt: "updated_at",
  indexes: [{
    name: "bimestre_unico_por_materia_ano",
    unique: true,
    fields: ["materia_id", "ano", "numero_bimestre"],
  }],
});

export default Bimestre;
