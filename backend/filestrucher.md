backend/
├── config/
│   ├── cloudinary.mjs
│   ├── db.mjs
│   ├── redis.mjs
│   └── passport.mjs
├── controllers/
│   ├── authController.mjs
│   ├── bookingController.mjs
│   ├── lockController.mjs
│   ├── movieController.mjs
│   ├── paymentController.mjs
│   └── scheduleController.mjs
├── middlewares/
│   ├── auth.mjs
│   ├── rateLimit.mjs
│   └── security.mjs
├── jobs/
│   ├── cleanupExpiredLocks.mjs
│   └── runCleanupLocks.mjs
├── models/
│   ├── Booking.mjs
│   ├── Movie.mjs
│   ├── Payment.mjs
│   ├── Review.mjs
│   ├── Schedule.mjs
│   └── user-model.mjs
├── routes/
│   ├── authRouter.mjs
│   ├── bookingRouter.mjs
│   ├── health.mjs
│   ├── movieRouter.mjs
│   ├── paymentRouter.mjs
│   └── scheduleRouter.mjs
├── utils/
│   ├── jwt.mjs
│   ├── redis-session.mjs
│   └── seatGenerator.mjs
│   └── seatLock.mjs
├── app.mjs
├── server.mjs
├── .env