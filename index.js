const express = require('express');
const db = require('./db/db.connection')
const ejs = require('ejs')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const routes = require('./routes/routes');
const multer = require('multer');

// Initialize database connection
db();

const app = express();
const PORT = process.env.PORT || 3000;

// Set JWT Secret (should be in environment variable in production)
process.env.JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// View engine setup
app.set('view engine', 'ejs')

// Middleware
app.use(bodyParser.urlencoded({extended: true}))
app.use(express.json())
app.use(express.static("public"))
app.use(cookieParser())

// Routes
app.use('/', routes);

// Start server
app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});
