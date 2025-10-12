├── backend/
    │   ├── app.mjs
    │   ├── filestrucher.md
    │   ├── package.json
    │   ├── server.mjs
    │   ├── config/
    │   │   ├── cloudinary.mjs
    │   │   ├── db.mjs
    │   │   ├── passport.mjs
    │   │   └── redis.mjs
    │   ├── controllers/
    │   │   ├── adminController.mjs
    │   │   ├── authController.mjs
    │   │   ├── bookingController.mjs
    │   │   ├── lockController.mjs
    │   │   ├── movieController.mjs
    │   │   ├── paymentController.mjs
    │   │   └── scheduleController.mjs
    │   ├── jobs/
    │   │   ├── cleanupExpiredLocks.mjs
    │   │   └── runCleanupLocks.mjs
    │   ├── middlewares/
    │   │   ├── auth.mjs
    │   │   ├── rateLimit.mjs
    │   │   └── security.mjs
    │   ├── models/
    │   │   ├── Booking.mjs
    │   │   ├── Movie.mjs
    │   │   ├── Payment.mjs
    │   │   ├── Review.mjs
    │   │   ├── Schedule.mjs
    │   │   └── user-model.mjs
    │   ├── routes/
    │   │   ├── adminRouter.mjs
    │   │   ├── authRoutes.mjs
    │   │   ├── bookingRouter.mjs
    │   │   ├── health.mjs
    │   │   ├── movieRouter.mjs
    │   │   ├── paymentRouter.mjs
    │   │   └── scheduleRoutes.mjs
    │   └── utils/
    │       ├── jwt.mjs
    │       ├── redis-session.mjs
    │       ├── seatGenerator.mjs
    │       ├── seatLock.mjs
    │       └── sendBookingEmail.mjs