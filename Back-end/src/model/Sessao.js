import { DataTypes } from "sequelize";
import conn from "../config/conn.js";

const Sessao = conn.define("Sessao", {
  token_hash: { type: DataTypes.STRING(64), primaryKey: true },
  usuario_id: { type: DataTypes.UUID, allowNull: false },
  expira_em: { type: DataTypes.DATE, allowNull: false },
}, {
  tableName: "sessoes",
  timestamps: false,
  indexes: [{ fields: ["usuario_id"] }, { fields: ["expira_em"] }],
});

export default Sessao;