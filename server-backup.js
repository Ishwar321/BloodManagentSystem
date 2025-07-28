const express = require("express");
const dotenv = require("dotenv");
const colors = require("colors");
const morgan = require("morgan");
const cors = require("cors");
const connectDB = require("./config/db");

//dot config
dotenv.config();

//mongodb connection
connectDB();

//rest object
const app = express();

//middlewares
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

//routes
// 1 test route
app.use("/api/v1/test", require("./routes/testRoutes"));
// 2 auth routes
app.use("/api/v1/auth", require("./routes/authRoutes"));
// 3 inventory routes
app.use("/api/v1/inventory", require("./routes/inventoryRoutes"));

//port
const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(
    `Node Server Running in ${process.env.DEV_MODE || 'development'} Mode On Port ${PORT}`.blue
  );
});
