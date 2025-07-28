const express = require("express");
const dotenv = require("dotenv");
const colors = require("colors");
const morgan = require("morgan");

//dot config
dotenv.config();

//rest object
const app = express();

//middlewares
app.use(express.json());
app.use(morgan("dev"));

//routes
app.get('/', (req, res) => {
  res.send('Server is running');
});

//port
const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Node Server Running on Port ${PORT}`.blue);
});
