const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

// Load environment variables from the current .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/logs", require("./routes/logRoutes"));
app.use("/companies", require("./routes/companyRoutes"));
app.use("/templates", require("./routes/templateRoutes"));
app.use("/", require("./routes/emailRoutes"));

app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});
