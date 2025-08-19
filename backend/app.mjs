import express from 'express';
import helmet from 'helmet'
import cookieParser from 'cookie-parser';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import dotev from 'dotenv'

import healthrouter from './routes/health.mjs'

dotev.config()

const app = express()
app.set("trust proxy", 1);

app.use(helmet())
app.use(cors({
    origin: [process.env.FRONTEND_URL],
    Credential: true
}));
app.use(express.json())
app.use(cookieParser())
app.use(compression())
app.use(morgan('dev'))

app.use('/api/check/health', healthrouter);

export default app;

