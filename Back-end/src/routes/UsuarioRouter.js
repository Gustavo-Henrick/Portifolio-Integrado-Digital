import { Router } from "express";
import { Usuario } from "../model/index.js";
import { erro } from "../controllers/validacao.js";
import { verifyPassword } from "../auth/password.js";
import { endSession, protectMutation, requireEditor, startSession } from "../auth/session.js";

const router = Router();
const attempts = new Map();
const windowMs = 15 * 60 * 1000;
let activeChecks = 0;

router.use((_req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

function limitLogin(req, res, next) {
  const now = Date.now();
  for (const [key, entry] of attempts) {
    if (entry.until <= now) attempts.delete(key);
  }
  const ip = req.ip;
  const attempt = attempts.get(ip) ?? { count: 0, until: now + windowMs };
  if (attempt.count >= 8 || activeChecks >= 2 || (!attempts.has(ip) && attempts.size >= 4096)) {
    res.set("Retry-After", String(Math.max(1, Math.ceil((attempt.until - now) / 1000))));
    return next(erro(429, "Muitas tentativas. Tente novamente mais tarde."));
  }
  attempt.count++;
  attempts.set(ip, attempt);
  activeChecks++;
  next();
}

const loginError = () => erro(401, "Usuário, e-mail ou senha inválidos.");

router.post("/login", protectMutation, limitLogin, async (req, res) => {
  try {
    const { nome, email, senha } = req.body ?? {};
    if (typeof nome !== "string" || nome.length > 120 ||
        typeof email !== "string" || email.length > 254 ||
        typeof senha !== "string" || !senha || Buffer.byteLength(senha, "utf8") > 256) {
      throw loginError();
    }
    const usuario = await Usuario.findOne({ where: { email: email.trim().toLowerCase(), pode_editar: true } });
    const hash = usuario?.senha_hash;
    const valid = await verifyPassword(senha, hash);
    if (!valid || usuario.nome.trim().toLowerCase() !== nome.trim().toLowerCase()) throw loginError();
    await startSession(req, res, usuario, hash);
    attempts.delete(req.ip);
    res.json({ id: usuario.id, nome: usuario.nome });
  } finally {
    activeChecks--;
  }
});

router.get("/me", requireEditor, (req, res) => {
  const { id, nome } = req.portfolioSession.usuario;
  res.json({ id, nome });
});

router.post("/logout", protectMutation, async (req, res) => {
  await endSession(req, res);
  res.sendStatus(204);
});

router.use((_req, _res, next) => next(erro(404, "Rota não encontrada.")));

export default router;