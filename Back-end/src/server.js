import app from "./app.js";
import conn from "./config/conn.js";
import iniciarBanco from "./config/iniciarBanco.js";

const port = Number(process.env.PORT || 3333);

try {
  await iniciarBanco();

  app.listen(port, () => console.log(`API do Portfólio Escolar na porta ${port}`));
} catch (error) {
  console.error("Falha ao iniciar a API:", error.message);
  await conn.close();
  process.exitCode = 1;
}
