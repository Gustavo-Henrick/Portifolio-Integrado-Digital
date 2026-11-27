import { DataTypes } from "sequelize";
import conn from "../config/conn.js";

const Semestre = conn.define("Semestre", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  numero_semestre: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { isInt: true, min: 1, max: 2 },
  },
  ano: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { isInt: true, min: 2020, max: 2026 },
  },
  conteudo_aprendido: { type: DataTypes.TEXT, allowNull: true },
  materia_id: { type: DataTypes.UUID, allowNull: false },
}, {
  tableName: "semestres",
  createdAt: "created_at",
  updatedAt: "updated_at",
  indexes: [{
    name: "semestre_unico_por_materia_ano",
    unique: true,
    fields: ["materia_id", "ano", "numero_semestre"],
  }],
});

export default Semestre;
