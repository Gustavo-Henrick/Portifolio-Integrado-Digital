import { Router } from "express";
import {
  criarBimestre,
  listarBimestres,
  consultarBimestre,
  atualizarBimestre,
  excluirBimestre,
} from "../controllers/BimestreController.js";

const router = Router();
router.post("/", criarBimestre);
router.get("/", listarBimestres);
router.get("/:id", consultarBimestre);
router.put("/:id", atualizarBimestre);
router.delete("/:id", excluirBimestre);

export default router;
