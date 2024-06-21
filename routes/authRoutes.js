import express from "express";
import { getUserByEmail } from "../helpers/userHelpers.js";
import { comparePassword } from "../helpers/authHelpers.js";
const router = express.Router();

router.post("/login", async (req, res) => {
   const { email, password } = req.body;

   if (!(email && password)) {
      return res.status(400).json({
         error: "Email and password are required",
      });
   }

   const user = await getUserByEmail(email);

   if (!user) return res.status(401).json({ msg: "User not registered!" });

   const isMatch = await comparePassword({ password, hash: user.password });

   if (!isMatch) return res.status(401).json({ msg: "Invalid credentials!" });

   delete user.password;

   req.session.user = user;

   res.status(200).json({ msg: "Logged in!" });
});

router.get("/logout", (req, res) => {
   req.session.destroy();
   res.json({ msg: "Logged out!" });
});

export default router;
