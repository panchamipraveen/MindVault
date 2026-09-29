const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();
const { createHandler } = require("graphql-http/lib/use/express");
const { schema, root } = require("./schema/schema");

const app = express();

const PORT = process.env.PORT || 3000;

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB connected successfully!"))
  .catch((error) => console.log("MongoDB connection error:", error));

app.get("/", (req, res) => {
  res.send("MindVault API is running!");
});

app.all(
  "/graphql",
  createHandler({
    schema,
    rootValue: root
  })
);

app.listen(PORT, () => {
  console.log(`MindVault server running on http://localhost:${PORT}`);
});