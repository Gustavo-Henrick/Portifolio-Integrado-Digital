import { createHash, randomBytes } from "node:crypto";
import { Op } from "sequelize";
import { Sessao, Usuario } from "../model/index.js";
import { erro } from "../controllers/validacao.js";

const lifetime = 8 * 60 * 60 * 1000;
const secure = process.env.NODE_ENV === "production";
const cookieName = secure ? "__Host-portfolio_session" : "portfolio_session";
const cookieOptions = { httpOnly: true, secure, sameSite: "strict", path: "/" };
const hashToken = (token) => createHash("sha256").update(token).digest("hex");

function sessionToken(req) {
  return req.get("cookie")?.split(";").map((entry) => entry.trim())
    .find((entry) => entry.startsWith(cookieName + "="))?.slice(cookieName.length + 1);
}

const localEditor = { id: "local-editor", nome: "Editor local" };
const localSessions = new Map();

function localHost(hostname) {
  return ["localhost", "127.0.0.1", "::1", "[::1]"].includes(hostname);
}

function localUrl(value) {
  if (!value || !URL.canParse(value)) return false;
  const url = new URL(value);
  return ["http:", "https:"].includes(url.protocol) && localHost(url.hostname);
}

function localRequest(req) {
  return !secure && process.env.PORTFOLIO_LOCAL_ACCESS !== "false" &&
    ["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(req.socket.remoteAddress) &&
    localUrl("http://" + req.get("host")) &&
    (!req.get("origin") || localUrl(req.get("origin")));
}

export function startLocalSession(req, res) {
  if (!localRequest(req) || !localUrl(req.get("origin"))) throw erro(404, "Rota não encontrada.");
  const now = Date.now();
  for (const [key, expires] of localSessions) {
    if (expires <= now) localSessions.delete(key);
  }
  const previous = sessionToken(req);
  if (previous) localSessions.delete(hashToken(previous));
  if (localSessions.size >= 128) throw erro(429, "Limite de sessões locais atingido.");

  const token = randomBytes(32).toString("hex");
  localSessions.set(hashToken(token), now + lifetime);
  res.cookie(cookieName, token, { ...cookieOptions, maxAge: lifetime });
  return localEditor;
}



async function activeSession(req) {
  const token = sessionToken(req);
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const key = hashToken(token);
  const expires = localSessions.get(key);
  if (expires !== undefined) {
    if (expires > Date.now() && localRequest(req)) return { usuario: localEditor };
    return null;
  }
  return Sessao.findOne({
    where: { token_hash: key, expira_em: { [Op.gt]: new Date() } },
    include: [{ model: Usuario, as: "usuario", attributes: ["id", "nome"], where: { pode_editar: true } }],
  });
}

export function protectMutation(req, res, next) {
  if (req.get("x-portfolio-request") !== "1" ||
      ["cross-site", "same-site"].includes(req.get("sec-fetch-site"))) {
    return next(erro(403, "Solicitação não autorizada."));
  }
  next();
}

export async function requireEditor(req, res, next) {
  const session = await activeSession(req);
  if (!session) throw erro(401, "Entre no portfólio para continuar.");
  req.portfolioSession = session;
  next();
}

export async function protectWrites(req, res, next) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  res.set("Cache-Control", "no-store");
  protectMutation(req, res, (error) => {
    if (error) return next(error);
    return requireEditor(req, res, next).catch(next);
  });
}

export async function startSession(req, res, user, checkedPasswordHash) {
  const oldToken = sessionToken(req);
  const token = randomBytes(32).toString("hex");
  await Sessao.sequelize.transaction(async (transaction) => {
    // Verifica novamente sob bloqueio, pois a senha pode mudar enquanto o hash é calculado.
    const current = await Usuario.findByPk(user.id, { transaction, lock: transaction.LOCK.UPDATE });
    if (!current?.pode_editar || current.senha_hash !== checkedPasswordHash) {
      throw erro(401, "Usuário, e-mail ou senha inválidos.");
    }
    const expired = { expira_em: { [Op.lte]: new Date() } };
    const where = /^[a-f0-9]{64}$/.test(oldToken ?? "")
      ? { [Op.or]: [expired, { token_hash: hashToken(oldToken) }] }
      : expired;
    await Sessao.destroy({ where, transaction });
    await Sessao.create({
      token_hash: hashToken(token),
      usuario_id: user.id,
      expira_em: new Date(Date.now() + lifetime),
    }, { transaction });
  });
  res.cookie(cookieName, token, { ...cookieOptions, maxAge: lifetime });
}

export async function endSession(req, res) {
  const token = sessionToken(req);
  if (/^[a-f0-9]{64}$/.test(token ?? "")) {
    const key = hashToken(token);
    if (!localSessions.delete(key)) await Sessao.destroy({ where: { token_hash: key } });
  }
  res.clearCookie(cookieName, cookieOptions);
}