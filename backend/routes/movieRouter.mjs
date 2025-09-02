import { Router } from "express";
import {
  addMovie,
  updateMovie,
  deleteMovie,
  getMovies,
  getMovieById,
} from "../controllers/movieController.mjs";

import { requireAuth, requireRole } from "../middlewares/auth.mjs";
import { createLimiter } from "../middlewares/rateLimit.mjs";

const router = Router();

// Rate limiter for reads
const movieLimiter = createLimiter({ max: 100, prefix: "rl:movies:" });

router.get("/", movieLimiter, getMovies);
router.get("/:id", movieLimiter, getMovieById);

router.post("/", requireAuth, requireRole("admin"), addMovie);
router.put("/:id", requireAuth, requireRole("admin"), updateMovie);
router.delete("/:id", requireAuth, requireRole("admin"), deleteMovie);

export default router;
