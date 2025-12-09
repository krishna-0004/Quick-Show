# Quick Show 
Quick Show is a fast, secure movie ticket booking platform where users sign in with Google, choose a movie and showtime, pick Prime/Classic seats in real time, pay, and instantly receive a confirmed ticket without double bookings. Built for a single-screen theatre today, with a clear path to scaling to 1000+ requests per second tomorrow.
[![License](https://img.shields.io/github/license/krishna-0004/Quick-Show)](./LICENSE)
[![Issues](https://img.shields.io/github/issues/krishna-0004/Quick-Show)](https://github.com/krishna-0004/Quick-Show/issues)
[![Stars](https://img.shields.io/github/stars/krishna-0004/Quick-Show)](https://github.com/krishna-0004/Quick-Show/stargazers)
## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Scripts](#scripts)
- [API Reference](#api-reference)
- [Folder Structure](#folder-structure)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

## Overview

Quick Show solves the problem of slow, error-prone movie booking by providing a real-time, web-based system with reliable seat locking, cut-off rules, and secure payments. It is ideal for theatre admins who want simple operations on free tiers and end-users who want a smooth booking flow on any device.

Key goals:
- No double bookings via Redis-backed seat locks and atomic booking confirmation.
- Free-tier friendly deployment (Vercel, Render, MongoDB Atlas, Upstash Redis) targeting 100 RPS with a clear scaling path.

## Features

- Google OAuth 2.0 authentication with `admin` and `user` roles.
- Movie catalog management (poster, trailer, duration, language, genre, release date) by admin.
- Showtimes per movie on a single screen, with Prime and Classic seat categories and separate pricing.
- Real-time seat selection and temporary locking using Redis with TTL to prevent race conditions.
- Strict booking cut-off rule: online booking closes 90 minutes before showtime.
- Secure checkout via Razorpay (test mode by default), with server-side price calculation and signature verification.
- Ticket generation with booking ID and booking status (`pending`, `confirmed`, `cancelled`).
- Movie ratings and reviews by users.
- Basic caching of movies and shows in Redis for faster reads.
- Security hardening: Helmet, CORS, validation, sanitization, and rate limiting.

## Tech Stack

- **Frontend:** vite + React (SPA on Vercel) for catalog, seat map, countdown timer, and checkout UI.
- **Backend:** Node.js, Express (Render free tier) exposing REST APIs for auth, catalog, seat locks, bookings, and payments.
- **Database:** MongoDB Atlas (free tier) for users, movies, shows, bookings, payments, and reviews.[file:48]
- **Cache / Locks:** Upstash Redis for seat locking and response caching on hot read endpoints.
- **Auth:** Google OAuth 2.0, JWT access tokens, and refresh tokens via httpOnly cookies.
- **Payments:** Razorpay (test mode), with optional webhooks for idempotent confirmation.

## Architecture

- **Client:** React app hosted on Vercel, initiating Google sign-in, showing movie catalog, rendering showtimes, seat map, and handling the booking flow.
- **API Server:** Stateless Node.js/Express app on Render that processes auth callbacks, catalog reads/writes, seat lock operations, bookings, and payment verification.
- **Database:** MongoDB Atlas for core entities (Users, Movies, Shows, Bookings, Payments, Reviews) with indexes on emails, titles, and show relations for performance.
- **Redis:** Upstash Redis instance for short-lived seat locks and cached responses for movie/show listing endpoints.

## Getting Started

### Prerequisites

- Node.js >= 18
- npm 
- MongoDB Atlas cluster
- Upstash Redis (or compatible Redis URL)
- Google OAuth credentials
- Razorpay or Stripe test keys (optional initially)

### Installation

1. **Clone the repository**
  ```
  git clone https://github.com/krishna-0004/Quick-Show.git
  cd Quick-Show
  ```

3. **Install backend dependencies**
  ```
  cd backend
  npm install
  cd ..
  ```

3. **Install frontend dependencies**
  ```
  cd frontend
  npm install
  cd ..
  ```


### Run locally
1. **Start backend**
   ```
   cd backend
   npm run server.mjs
   ```
3. **Start frontend**
   ```
   cd frontend
   npm run dev
   ```

Adjust the commands above to match the actual scripts in your `package.json` once wired.

## Environment Variables

Create a `.env` file in the backend root with at least:
```
PORT = 
FRONTEND_URL = 

MONGO_URL = 
REDIS_URL =
REDIS_TLS=


GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=


JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
ACCESS_TOKEN_TTL=
REFRESH_TOKEN_TTL_DAYS=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

BOOKING_LOCK_TTL_SECONDS=

RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=

EMAIL_USER=
EMAIL_PASS=
```

Create a `.env` file in the frontend root with at least:
'''
VITE_API_URL=
VITE_CLOUDINARY_CLOUD_NAME=
VITE_CLOUDINARY_UPLOAD_PRESET=

VITE_RAZORPAY_KEY_ID=

REACT_APP_EMAILJS_SERVICE_ID=
REACT_APP_EMAILJS_TEMPLATE_ID=
REACT_APP_EMAILJS_PUBLIC_KEY=
'''

Never commit this file; keep all secrets local or in your hosting provider’s env settings.

## Scripts

Typical scripts (update based on your actual `package.json`):

- `npm run dev` – run backend in dev mode (nodemon).  
- `npm run server` – run backend server.  
- `cd client && npm start` – run React dev server.  
- `npm test` – run backend tests (unit/integration).  

For production deploy:
- Frontend: `npm run build` in `client` and deploy to Vercel.  
- Backend: `npm start` on Render with environment variables configured.[file:48]

## API Reference

High-level API surface (paths may change as you code):

### Public

- `GET /api/movies` – list movies (Redis cached).[file:48]  
- `GET /api/shows?movieId=` – list showtimes for a movie with seat availability summary.[file:48]

### Auth

- `GET /auth/google` – redirect to Google OAuth.[file:48]  
- `GET /auth/google/callback` – handle Google callback, create/find user, issue tokens.
- `POST /auth/refresh` – rotate access token using refresh cookie.  
- `POST /auth/logout` – clear refresh cookie.[file:48]

### Admin (role: admin)

- `POST /api/admin/movies` – create movie.  
- `DELETE /api/admin/movies/:id` – delete movie.  
- `POST /api/admin/shows` – create show with seat categories and prices.  
- `DELETE /api/admin/shows/:id` – delete show (and bust related caches).

### Booking

- `POST /api/locks` – lock seats for a show (enforces cut-off rule and TTL in Redis).  
- `POST /api/payments/order` – create payment order with server-side amount calculation. 
- `POST /api/bookings/confirm` – verify payment, re-check availability, write booking and payment transactionally, and finalize seats.
- `POST /api/payments/webhook` – optional webhook for idempotent booking confirmation.

## Folder Structure

Example target folder structure (adapt to your repo):
1. **Backend**
```
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
```
2. **Frontend**
```
frontend/
        ├── README.md
        ├── eslint.config.js
        ├── filestrucher.md
        ├── index.html
        ├── package.json
        ├── vite.config.js
        └── src/
            ├── App.jsx
            ├── index.css
            ├── main.jsx
            ├── components/
            │   ├── DateTimeSelector.jsx
            │   ├── Footer.jsx
            │   ├── HeroSlider.jsx
            │   ├── Loader.jsx
            │   ├── MovieDetails.jsx
            │   ├── Navbar.jsx
            │   ├── ProtectedRoute.jsx
            │   ├── PublicMovieList.jsx
            │   ├── SeatMap.jsx
            │   ├── SeatTypeSelector.jsx
            │   └── Admin/
            │       ├── AdminRoute.jsx
            │       ├── DashboardLayout.jsx
            │       ├── MovieForm.jsx
            │       ├── ScheduleForm.jsx
            │       ├── Sidebar.jsx
            │       └── Topbar.jsx
            ├── context/
            │   └── AuthContext.jsx
            ├── pages/
            │   ├── admin/
            │   │   ├── AdminDashboard.jsx
            │   │   ├── AdminMovies.jsx
            │   │   ├── Show.jsx
            │   │   └── ShowAdmin.jsx
            │   ├── PagesStyle/
            │   │   ├── AdminDashboard.css
            │   │   ├── AdminMovies.css
            │   │   ├── BookingPage.css
            │   │   ├── contact.css
            │   │   ├── Home.css
            │   │   └── MyBookings.css
            │   └── user/
            │       ├── AboutUs.jsx
            │       ├── BookingPage.jsx
            │       ├── ContactUs.jsx
            │       ├── HomePage.jsx
            │       └── MyBookings.jsx
            ├── style/
            │   ├── Aboutus.css
            │   ├── DashboardLayout.css
            │   ├── DateTimeSelector.css
            │   ├── Footer.css
            │   ├── HeroSlider.css
            │   ├── Loader.css
            │   ├── MovieDetails.css
            │   ├── MovieForm.css
            │   ├── Navbar.css
            │   ├── PublicMovieList.css
            │   ├── SeatMap.css
            │   ├── SeatTypeSelector.css
            │   ├── Sidebar.css
            │   └── Topbar.css
            └── utils/
                ├── axios.js
                └── time.js

```


## Roadmap

- [ ] Implement full backend API (auth, catalog, shows, booking, payments).
- [ ] Build responsive React UI with real-time seat map and countdown timer.  
- [ ] Integrate Stripe/Razorpay test mode fully, then add webhook-based confirmation. 
- [ ] Add admin dashboard for movies and shows management.  
- [ ] Add ratings/reviews UI and aggregate movie rating.
- [ ] Enhance observability (structured logs, health checks, better error pages). 
- [ ] Scale to 1000+ RPS with PM2 clustering, upgraded Mongo/Redis plans, and Nginx.

## Contributing

Contributions, issues, and feature suggestions are welcome via GitHub Issues and pull requests.  
Before contributing, please open an issue to discuss major feature ideas or changes.

## License

This project is licensed under the **MIT License** – see the [`LICENSE`](./LICENSE) file for details.

## Contact

**Krishna**  
GitHub: [@krishna-0004](https://github.com/krishna-0004)  
Project Link: [Quick Show](https://github.com/krishna-0004/Quick-Show)    
Live Link: [Quick Show](https://quick-show-seven-kappa.vercel.app/)
