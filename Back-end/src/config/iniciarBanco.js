import "../model/index.js";
import conn, { schema } from "./conn.js";

export default async function iniciarBanco() {
  await conn.authenticate();
  await conn.getQueryInterface().createSchema(schema);
  await conn.sync();

  // sync cria as tabelas novas. As colunas abaixo também precisam existir nas instalações anteriores.
  await conn.transaction(async (transaction) => {
    for (const sql of [
      `ALTER TABLE "${schema}"."materias" ADD COLUMN IF NOT EXISTS "conteudo_anual" JSONB NOT NULL DEFAULT '{}'::jsonb`,
      `ALTER TABLE "${schema}"."bimestres" ADD COLUMN IF NOT EXISTS "participacao" JSONB`,
      `ALTER TABLE "${schema}"."trabalhos" ADD COLUMN IF NOT EXISTS "evidencias" JSONB NOT NULL DEFAULT '[]'::jsonb`,
      `ALTER TABLE "${schema}"."projetos" ADD COLUMN IF NOT EXISTS "anexos" JSONB NOT NULL DEFAULT '[]'::jsonb`,
      `ALTER TABLE "${schema}"."semestres" ADD COLUMN IF NOT EXISTS "conteudo_aprendido" TEXT`,
      `ALTER TABLE "${schema}"."trabalhos" ADD COLUMN IF NOT EXISTS "imagens" JSONB NOT NULL DEFAULT '[]'::jsonb`,
      `ALTER TABLE "${schema}"."usuarios" ADD COLUMN IF NOT EXISTS "pode_editar" BOOLEAN NOT NULL DEFAULT false`,
      `ALTER TABLE "${schema}"."semestres" ADD COLUMN IF NOT EXISTS "registros_portfolio" JSONB NOT NULL DEFAULT '{}'::jsonb`,
    ]) {
      await conn.query(sql, { transaction });
    }
  });
}
