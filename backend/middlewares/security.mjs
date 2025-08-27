import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import mongoSanitize from "express-mongo-sanitize";
import xss from "xss"; // ✅ modern replacement
import hpp from "hpp";
import morgan from "morgan";

const xssFilter = new xss.FilterXSS();

export const applySecurity = (app) => {
  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          "img-src": ["'self'", "data:", "https:"],
          "frame-src": [
            "'self'",
            "https://www.youtube.com",
            "https://player.vimeo.com",
          ],
          "media-src": ["'self'", "https:"],
        },
      },
    })
  );

  app.use(
    cors({
      origin: process.env.FRONTEND_URL,
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );

  app.use(compression());

  // ✅ sanitize body & params only
  app.use((req, res, next) => {
    if (req.body) mongoSanitize.sanitize(req.body);
    if (req.params) mongoSanitize.sanitize(req.params);

    // ✅ XSS sanitize body, params (skip req.query)
    if (req.body) req.body = deepXssSanitize(req.body, xssFilter);
    if (req.params) req.params = deepXssSanitize(req.params, xssFilter);

    next();
  });

  app.use(hpp());

  if (process.env.NODE_ENV !== "production") app.use(morgan("dev"));
};

// Helper: deep sanitize recursively
function deepXssSanitize(obj, filter) {
  if (typeof obj === "string") return filter.process(obj);
  if (Array.isArray(obj)) return obj.map((item) => deepXssSanitize(item, filter));
  if (obj && typeof obj === "object") {
    const sanitized = {};
    for (const key in obj) {
      sanitized[key] = deepXssSanitize(obj[key], filter);
    }
    return sanitized;
  }
  return obj;
}
