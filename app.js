import express from "express";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import { connectToMongoDB } from "./config/connection.js";
import { config as dotenvConfig } from "dotenv";
import session from "express-session";
import MongoStore from "connect-mongo";
import { requireAdmin, requireLogin } from "./middleware/authMiddleware.js";
import cors from "cors";
import collections from "./config/collections.js";

dotenvConfig();

const app = express();
const port = 3100;

app.use(cors());

// Middleware to parse JSON requests
app.use(express.json());

// Middleware to parse URL-encoded requests
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
   console.log("Incoming request: " + req.method + " " + req.url);
   res.on("finish", () => {
      console.log("Outgoing response: " + res.statusCode);
   });
   next();
});

app.use(
   session({
      secret: process.env.SESSION_SECRET_KEY,
      cookie: { maxAge: 24 * 60 * 60 * 1000 * 30, sameSite: true }, // = 30 days (hh:mm:ss:ms)*days
      saveUninitialized: false,
      resave: false,
      store: MongoStore.create({
         mongoUrl: process.env.DB_URI,
         touchAfter: 24 * 3600, // update every 24 hours
         dbName: collections.SESSION,
      }),
   })
);

app.get("/", (req, res) => {
   res.send("Hello World!");
});
app.use("/auth", authRoutes);
app.use("/user", requireLogin, userRoutes);
app.use("/admin", requireLogin, requireAdmin, adminRoutes);

const startServer = async () => {
   // connecting to mongoDB server
   await connectToMongoDB();

   app.listen(port, () => {
      console.log(`Example app listening on port ${port}`);
   });
};

startServer();
