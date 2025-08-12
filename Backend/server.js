require('dotenv').config();
const connectDB = require('./config/database');
const express = require('express');
const cors = require('./config/cors');
const app = express();
connectDB();

// Middleware
app.use(express.json());
app.use(cors); 


// Start server
const PORT = process.env.BACKEND_PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));