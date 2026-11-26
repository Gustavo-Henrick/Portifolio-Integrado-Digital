import { randomBytes, scrypt } from "node:crypto";
import { promisify } from "node:util";
import { Router } from "express";
import { Usuario } from "../model/index.js";
import { erro, texto, validarCorpo } from "../controllers/validacao.js";

const gerarChave = promisify(scrypt);
const router = Router();

function validarEmail(valor) {
  const email = texto(valor, "email", 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    throw erro(400, "Dados inválidos", [{ field: "email", message: "Informe um e-mail válido." }]);
  }
  return email;
}

function validarSenha(senha) {
  if (typeof senha !== "string" || Array.from(senha).length < 8 ||
      !senha.trim() || Buffer.byteLength(senha, "utf8") > 256) {
    throw erro(400, "Dados inválidos", [{
      field: "senha",
      message: "Use uma senha com pelo menos 8 caracteres e até 256 bytes.",
    }]);
  }
  return senha;
}

router.post("/", async (req, res) => {
  const { nome, email, senha } = validarCorpo(req.body, false, {
    nome: (valor) => texto(valor, "nome", 120),
    email: validarEmail,
    senha: validarSenha,
  });

  const salt = randomBytes(16);
  const hash = await gerarChave(senha, salt, 64, { N: 131_072, r: 8, p: 1, maxmem: 256 * 1024 * 1024 });
  const senha_hash = ["scrypt", 131_072, 8, 1, salt.toString("hex"), hash.toString("hex")].join("$");
  const usuario = await Usuario.create({ nome, email, senha_hash });

  res.status(201).json({ id: usuario.id, nome: usuario.nome, email: usuario.email });
});

export default router;
