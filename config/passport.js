const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/userSchema');
const env = require('dotenv').config();


const generateReferralCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: 'http://localhost:3000/auth/google/callback'
},

async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await User.findOne({ googleId: profile.id });
        
        if (user) {
            console.log("User already exists, logging in");
            return done(null, user);
        } else {
            user = new User({
                fullname: profile.displayName,
                email: profile.emails[0].value,
                googleId: profile.id,
                referralCode:generateReferralCode(),
                isVerified: true // Adding verification status
          
            });
            
            await user.save();
            console.log("New user created with Google OAuth");
            return done(null, user);
        }
    } catch (error) {
        console.error("Error in Google OAuth strategy:", error);
        return done(error, null); // Fixed this line - was using 'err' instead of 'error'
    }
}));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    User.findById(id)
    .then(user => {
        done(null, user);
    })
    .catch(err => {
        done(err,null)
    })
});


module.exports = passport;