import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import mongoSanitize from "express-mongo-sanitize";
import xss from "xss-clean";
import hpp from "hpp";
import morgan from "morgan";

export const applySecurity = (app) => {
  app.use(helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "img-src": ["'self'", "data:", "https:"],
        "frame-src": ["'self'", "https://www.youtube.com", "https://player.vimeo.com"],
        "media-src": ["'self'", "https:"],
      },
    },
  }));

  app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  }));

  app.use(compression());
  app.use(mongoSanitize());
  app.use(xss());
  app.use(hpp());
  if (process.env.NODE_ENV !== "production") app.use(morgan("dev"));
};
