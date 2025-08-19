import express from 'express';
import Redis from 'ioredis';
import { mongo } from 'mongoose';
import { checkMongoHealth } from '../config/db.mjs';
import { checkRedisHealth } from '../config/redis.mjs';

const router = express.Router()

router.get('/', async(req, res) => {
    const mongo = await checkMongoHealth();
    const redis = await checkRedisHealth();

    res.status(200).json({
        status: 'ok',
        mongo,
        redis,
        message: "Server is running properlly",
        timestap: new Date() 
    });
});

export default router;