import Sessao from "./Sessao.js";
import Usuario from "./Usuario.js";
import Materia from "./Materia.js";
import Bimestre from "./Bimestre.js";
import Semestre from "./Semestre.js";
import { Capitulo, Projeto, Trabalho } from "./RegistrosPortfolio.js";

function vincular(pai, filho, plural, singular) {
  const options = {
    foreignKey: { name: singular + "_id", allowNull: false },
    onUpdate: "CASCADE",
    onDelete: "RESTRICT",
  };

  pai.hasMany(filho, { ...options, as: plural });
  filho.belongsTo(pai, { ...options, as: singular });
}

Sessao.belongsTo(Usuario, { as: "usuario", foreignKey: "usuario_id", onDelete: "CASCADE" });
vincular(Materia, Bimestre, "bimestres", "materia");
vincular(Materia, Semestre, "semestres", "materia");
vincular(Bimestre, Capitulo, "capitulos", "bimestre");
vincular(Bimestre, Trabalho, "trabalhos", "bimestre");
vincular(Semestre, Projeto, "projetos", "semestre");

export { Sessao, Usuario, Materia, Bimestre, Semestre, Capitulo, Projeto, Trabalho };
