// middlewares/security.mjs

import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import mongoSanitize from "express-mongo-sanitize";
import xss from "xss"; // ✅ modern XSS sanitizer
import hpp from "hpp";
import morgan from "morgan";

// Create a reusable XSS filter instance
const xssFilter = new xss.FilterXSS();

/**
 * applySecurity
 * - Applies global security middlewares to the Express app
 * - Protects against common web vulnerabilities (XSS, CSRF, NoSQL Injection, HPP, etc.)
 */
export const applySecurity = (app) => {
  // =======================
  // Helmet → Secure HTTP headers
  // =======================
  app.use(
    helmet({
      crossOriginEmbedderPolicy: false, // disable COEP (useful for dev/if breaking embeds)
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          "img-src": ["'self'", "data:", "https:"], // allow images from self, data URIs, HTTPS
          "frame-src": [
            "'self'",
            "https://www.youtube.com",
            "https://player.vimeo.com",
          ], // allow embedding YouTube/Vimeo
          "media-src": ["'self'", "https:"], // allow media from self + HTTPS
        },
      },
    })
  );

  // =======================
  // CORS → Control frontend access
  // =======================
  app.use(
    cors({
      origin: [
        process.env.FRONTEND_URL,
        "http://localhost:5173", // ✅ Add your live frontend domain
      ], // only allow your frontend
      credentials: true, // allow cookies/credentials
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );

  // =======================
  // Compression → Gzip responses
  // =======================
  app.use(compression());

  // =======================
  // Sanitization (NoSQL Injection + XSS)
  // =======================
  app.use((req, res, next) => {
    // Prevent MongoDB operator injection ($gt, $ne, etc.)
    if (req.body) mongoSanitize.sanitize(req.body);
    if (req.params) mongoSanitize.sanitize(req.params);

    // XSS sanitize body & params recursively
    // (skip req.query for flexibility in search/filter APIs)
    if (req.body) req.body = deepXssSanitize(req.body, xssFilter);
    if (req.params) req.params = deepXssSanitize(req.params, xssFilter);

    next();
  });

  // =======================
  // HPP → Prevent HTTP Parameter Pollution
  // =======================
  app.use(hpp());

  // =======================
  // Logging (dev only)
  // =======================
  if (process.env.NODE_ENV !== "production") app.use(morgan("dev"));
};

// =======================
// Helper: Deep Sanitize Objects
// Recursively applies XSS filter to all strings in objects/arrays
// =======================
function deepXssSanitize(obj, filter) {
  if (typeof obj === "string") return filter.process(obj); // sanitize strings
  if (Array.isArray(obj))
    return obj.map((item) => deepXssSanitize(item, filter)); // sanitize arrays
  if (obj && typeof obj === "object") {
    const sanitized = {};
    for (const key in obj) {
      sanitized[key] = deepXssSanitize(obj[key], filter);
    }
    return sanitized;
  }
  return obj; // return primitives untouched
}
