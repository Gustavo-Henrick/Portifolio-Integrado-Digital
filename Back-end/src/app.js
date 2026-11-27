import { protectWrites } from "./auth/session.js";
import UsuarioRouter from "./routes/UsuarioRouter.js";
import express from "express";
import { ForeignKeyConstraintError, UniqueConstraintError, ValidationError } from "sequelize";
import BimestreRouter from "./routes/BimestreRouter.js";
import MateriaRouter from "./routes/MateriaRouter.js";

import PortfolioRouter from "./routes/PortfolioRouter.js";

const app = express();
app.disable("x-powered-by");
app.use((_req, res, next) => {
  res.set("X-Content-Type-Options", "nosniff");
  next();
});
app.use("/usuarios", express.json({ limit: "8kb" }), UsuarioRouter);
app.use(protectWrites);
app.use(["/projetos", "/semestres/projetos", "/semestre/projeto", "/trabalhos", "/bimestre/trabalho"], express.json({ limit: "6mb" }));
app.use(express.json({ limit: "512kb" }));

app.use("/materias", MateriaRouter);
app.use("/bimestres", BimestreRouter);
app.use(PortfolioRouter);

app.use((_req, res) => res.status(404).json({ message: "Rota não encontrada." }));

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);

  if (error instanceof UniqueConstraintError) {
    const mensagens = {
      usuarios: "Já existe um usuário com esse e-mail.",
      bimestres: "Já existe um bimestre com essa matéria, ano e número.",
      semestres: "Já existe um semestre com essa matéria, ano e número.",
      capitulos: "Já existe um capítulo com esse número no bimestre.",
    };
    return res.status(409).json({ message: mensagens[req.path.split("/")[1]] || "Registro duplicado." });
  }
  if (error instanceof ForeignKeyConstraintError) {
    if (req.method === "DELETE") {
      return res.status(409).json({ message: "O registro possui itens vinculados." });
    }
    return res.status(404).json({ message: "Registro vinculado não encontrado." });
  }
  if (error instanceof ValidationError) {
    return res.status(400).json({
      message: "Dados inválidos",
      details: error.errors.map(({ path, message }) => ({ field: path, message })),
    });
  }

  if (error.type === "entity.parse.failed") {
    return res.status(400).json({ message: "JSON inválido." });
  }
  if (error.type === "entity.too.large") {
    return res.status(413).json({ message: "O corpo da requisição excede o limite." });
  }
  if ([400, 401, 403, 404, 409, 429].includes(error.status)) {
    return res.status(error.status).json({ message: error.message, details: error.details });
  }

  if (req.path.split("/")[1] === "usuarios") {
    console.error("Falha na autenticação:", error.name);
  } else {
    console.error("Falha na API:", error.name);
  }
  return res.status(500).json({ message: "Erro interno do servidor." });
});

export default app;
