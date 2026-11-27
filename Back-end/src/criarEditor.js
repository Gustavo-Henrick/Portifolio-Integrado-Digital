import { createInterface } from "node:readline/promises";
import { Writable } from "node:stream";
import conn from "./config/conn.js";
import iniciarBanco from "./config/iniciarBanco.js";
import { Sessao, Usuario } from "./model/index.js";
import { hashPassword } from "./auth/password.js";

const [name, address] = process.argv.slice(2);
const email = address?.trim().toLowerCase();

async function configureEditor() {
  if (!name?.trim() || name.length > 120 || !email ||
      email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !process.stdin.isTTY) {
    throw new Error("Use um terminal e informe o nome e o e-mail do editor.");
  }

  const hidden = new Writable({ write(_chunk, _encoding, callback) { callback(); } });
  const prompt = createInterface({ input: process.stdin, output: hidden, terminal: true });
  prompt.once("SIGINT", () => prompt.close());
  let password;
  let confirmation;
  try {
    process.stdout.write("Nova senha do editor (entrada oculta): ");
    password = await prompt.question("");
    process.stdout.write("\nConfirme a senha: ");
    confirmation = await prompt.question("");
  } finally {
    prompt.close();
    process.stdout.write("\n");
  }

  if (password !== confirmation || Array.from(password).length < 16 ||
      Buffer.byteLength(password, "utf8") > 256 || !password.trim()) {
    throw new Error("As senhas devem coincidir e ter pelo menos 16 caracteres e até 256 bytes.");
  }

  const senha_hash = await hashPassword(password);
  await iniciarBanco();
  await conn.transaction(async (transaction) => {
    const [user] = await Usuario.upsert({
      nome: name.trim(), email, senha_hash, pode_editar: true,
    }, { transaction, conflictFields: ["email"] });
    await Sessao.destroy({ where: { usuario_id: user.id }, transaction });
  });
  console.log("Conta de editor configurada. Sessões anteriores foram encerradas.");
}

try {
  await configureEditor();
} catch (error) {
  console.error("Falha ao configurar editor:", error.name === "Error" ? error.message : error.name);
  process.exitCode = 1;
} finally {
  await conn.close();
}