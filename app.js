const express = require('express');
const path = require('path');
const env = require("dotenv").config();
const ejs = require('ejs');
const userRouter = require('./routes/user');
const adminRouter = require('./routes/admin');
const Database = require("./config/db");
const session = require("express-session");
const passport = require('./config/passport');
const bodyParser = require('body-parser');
const MongoStore = require('connect-mongo');
const createError = require('http-errors');
const User = require('./models/userSchema');

// Initialize Express app
const app = express();

// Database connection - moved to the top to ensure it runs first
Database();

// View engine setup
app.set("views", [path.join(__dirname, 'views/users'), path.join(__dirname, 'views/admins')]);
app.set("view engine", "ejs");

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Body parser middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Express built-in middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Session configuration
const sessionConfig = {
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI,
        collectionName: 'sessions'
    }),
    cookie: {
        secure: process.env.NODE_ENV === 'production', // true in production with HTTPS
        httpOnly: true,
        maxAge: 72 * 60 * 60 * 1000,
        sameSite: 'strict'
    }
};

// Main session middleware
app.use(session(sessionConfig));

// Admin session - using different cookie name
app.use('/admin', session({
    ...sessionConfig,
    name: 'admin_sid',
    cookie: {
        ...sessionConfig.cookie,
        name: 'admin_sid'
    }
}));

// Passport initialization
app.use(passport.initialize());
app.use(passport.session());

// User status check middleware
app.use(async (req, res, next) => {
    try {
        if (req.session.passport?.user || req.session.user) {
            const userId = req.session.passport?.user || req.session.user._id || req.session.user;
            
            if (!userId) {
                console.log('Invalid user session');
                return next();
            }

            const user = await User.findById(userId);
            
            if (!user) {
                console.log('User not found - clearing session');
                req.logout((err) => {
                    if (err) console.error("Logout error:", err);
                    req.session.destroy();
                    res.clearCookie('user_sid');
                    res.clearCookie('admin_sid');
                });
                return next();
            }

            if (user.isBlocked) {
                console.log(`Blocked user access attempt: ${user.email}`);
                req.logout((err) => {
                    if (err) console.error("Logout error:", err);
                    req.session.destroy();
                    res.clearCookie('user_sid');
                    res.clearCookie('admin_sid');
                });
                return res.redirect('/login?error=account_blocked');
            }

            // Attach user to request
            req.user = user;
            res.locals.user = user;
        }
        next();
    } catch (error) {
        console.error('User check middleware error:', error);
        next(error);
    }
});

// Local variables middleware
app.use((req, res, next) => {
    res.locals.user = req.user || null;
    next();
});

// Cache control middleware
app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    next();
});

// Routes
app.use('/', userRouter);
app.use('/admin', adminRouter);

// 404 Handler


// Error handling middleware
app.use((err, req, res, next) => {
    // Set locals
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    res.locals.status = err.status || 500;

    // Log the error
    console.error(`[${new Date().toISOString()}] Error ${res.locals.status}: ${err.message}`);
    if (res.locals.error.stack) {
        console.error(err.stack);
    }

    // Render error page
    res.status(res.locals.status);
    
    // Check if error template exists
    const errorTemplatePath = path.join(__dirname, 'views/users/error.ejs');
    const fs = require('fs');
    
    if (fs.existsSync(errorTemplatePath)) {
        res.render('error', {
            title: `Error ${res.locals.status}`,
            status: res.locals.status,
            message: err.message
        });
    } else {
        // Fallback error response
        res.format({
            html: () => {
                res.send(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>Error ${res.locals.status}</title>
                    </head>
                    <body>
                        <h1>Error ${res.locals.status}</h1>
                        <p>${err.message}</p>
                    </body>
                    </html>
                `);
            },
            json: () => {
                res.json({ error: err.message, status: res.locals.status });
            },
            default: () => {
                res.type('txt').send(`Error ${res.locals.status}: ${err.message}`);
            }
        });
    }
});
app.use((req, res, next) => {
    next(createError(404, 'Page Not Found'));
});
// Server startup
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port http://localhost:${PORT}`);
});