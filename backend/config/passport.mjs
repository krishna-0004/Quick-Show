// config/passport.mjs

// Import required modules
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { User } from "../models/user-model.mjs";
import dotenv from "dotenv";

dotenv.config();

// Configure Google OAuth strategy
passport.use(
  new GoogleStrategy(
    {
      // Google OAuth credentials (from .env)
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:4000/api/auth/google/callback",
    },

    // Verify callback (runs after Google login is successful)
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        // Extract email from Google profile
        const email = profile.emails?.[0]?.value;
        if (!email) return done(new Error("No email from Google"), null);

        // Check if user already exists in DB
        let user = await User.findOne({ email });

        // If new user → create in DB
        if (!user) {
          user = await User.create({
            googleId: profile.id, 
            name: profile.displayName, 
            email,
            picture: profile.photos?.[0]?.value, 
            role: "user", 
          });
        } 
        
        // If existing user but no googleId → link Google account
        else if (!user.googleId) {
          user.googleId = profile.id;
          await user.save();
        }

        // Authentication successful → pass user to next step
        return done(null, user);
      } catch (err) {
        // Handle errors
        return done(err, null);
      }
    }
  )
);

// Export passport to use in routes/middleware
export default passport;
