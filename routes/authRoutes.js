import express from "express";
import { createUser, getUserByEmail } from "../helpers/userHelpers.js";
import {
   comparePassword,
   hashPassword,
   linkSessionAndUser,
   validateEmail,
   validatePassword,
} from "../helpers/authHelpers.js";
const router = express.Router();

router.get("/", (req, res) => {
   const { user } = req.session;
   return res.status(201).json({ user });
});

router.post("/sign-up", async (req, res) => {
   try {
      const userData = req.body;

      if (!(userData.email && userData.password)) {
         res.status(400).json({
            error: true,
            msg: "Email and password are required!",
         });
         return;
      }

      // validating email and password
      if (!validateEmail(userData.email))
         return res.status(400).json({ error: true, msg: "Invalid email" });
      if (!validatePassword(userData.password))
         return res.status(400).json({ error: true, msg: "Invalid password" });

      let hashedPassword = undefined;

      try {
         hashedPassword = hashPassword({ password: userData.password });
      } catch (error) {
         console.error(error);
         res.status(500).json({
            error: true,
            msg: "Server Error: Failed to hash password!",
         });
         return;
      }

      const newUser = {
         name: { firstName: userData.firstName, lastName: userData.lastName },
         email: userData.email,
         password: hashedPassword,
      };

      try {
         await createUser(newUser);
      } catch (error) {
         if (error.code === 11000)
            return res.status(400).json({
               error: true,
               msg: "User with this email already exist!",
               code: "DuplicateUser",
            });
         else {
            res.status(500).json({
               error: true,
               msg: "Server Error: Failed to create user!",
            });
            console.error(error);
            return;
         }
      }
      res.status(201).json({ error: false, msg: "User created successfully!" });
   } catch (error) {
      res.status(500).json({
         error: true,
         msg: "Server Error: Failed to create user",
      });
      console.error(error);
   }
});

router.post("/login", async (req, res) => {
   const { email, password } = req.body;

   // check if email and password exist
   if (!(email && password)) {
      return res.status(400).json({
         error: true,
         msg: "Email and password are required",
      });
   }

   // validating email and password
   if (!validateEmail(email))
      return res.status(400).json({ error: true, msg: "Invalid email" });
   if (!validatePassword(password))
      return res.status(400).json({ error: true, msg: "Invalid password" });

   // check if user exists
   const user = await getUserByEmail(email);
   if (!user)
      return res.status(401).json({
         msg: "User not registered!",
         error: true,
         code: "UnknownUser",
      });

   const isMatch = await comparePassword({ password, hash: user.password });

   if (!isMatch)
      return res.status(401).json({
         msg: "Invalid credentials!",
         error: true,
         code: "InvalidCredential",
      });

   delete user.password;

   req.session.user = user;

   linkSessionAndUser({ sessionId: req.session.id, accountId: user._id });

   res.status(200).json({ msg: "Logged in!", user });
});

router.post("/logout", (req, res) => {
   req.session.destroy();
   res.json({ msg: "Logged out!" });
});

export default router;
