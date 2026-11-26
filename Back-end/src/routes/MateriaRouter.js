import { Router } from "express";
import {
  criarMateria,
  listarMaterias,
  consultarMateria,
  atualizarMateria,
  excluirMateria,
} from "../controllers/MateriaController.js";

import { atualizarConteudoAnual, consultarConteudoAnual } from "../controllers/ConteudoAnualController.js";

const router = Router();
router.route("/:id/portfolio/:ano").get(consultarConteudoAnual).put(atualizarConteudoAnual);
router.post("/", criarMateria);
router.get("/", listarMaterias);
router.get("/:id", consultarMateria);
router.put("/:id", atualizarMateria);
router.delete("/:id", excluirMateria);

export default router;
