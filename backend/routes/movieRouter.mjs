import { Router } from "express";
import { addMovie, updateMovie, deleteMovie, getMovies, getMovieById } from "../controllers/movieController.mjs";

import { requireAuth, requireRole } from "../middlewares/auth.mjs";
import { createLimiter } from "../middlewares/rateLimit.mjs";

const router = Router();

const movieLimiter = createLimiter({ max: 100, prefix: "rl:movies:" });

router.use(requireAuth, requireRole("admin"), movieLimiter);

router.get("/", getMovies);
router.get("/:id", getMovieById);
router.post("/", addMovie)
router.put("/:id", updateMovie);
router.delete("/:id", deleteMovie);

export default router;