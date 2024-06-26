import express from "express";
import { createUser, getUserByEmail } from "../helpers/userHelpers.js";
import {
   comparePassword,
   createOrUpsertUserGoogle,
   hashPassword,
   linkSessionAndUser,
   validateEmail,
   validatePassword,
} from "../helpers/authHelpers.js";
import { OAuth2Client } from "google-auth-library";
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

      // checking if the sign-up is called by and admin
      const signUpByAdmin = req?.session?.user?.role === "admin" ? true : false;

      const newUser = {
         name: { firstName: userData.firstName, lastName: userData.lastName },
         email: userData.email,
         password: hashedPassword,
         role: signUpByAdmin ? userData.role : "user", // if the sign-up is done by an admin, then use the role set by the admin.
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

router.post("/sign-in/google", async (req, res) => {
   const { credential } = req.body;
   const idToken = credential;

   const { CLIENT_ID } = process.env;

   const client = new OAuth2Client(CLIENT_ID);

   try {
      // Verify the ID token using the OAuth2Client
      const ticket = await client.verifyIdToken({
         idToken,
         audience: CLIENT_ID,
      });

      const payload = ticket.getPayload();

      const extractedUser = {
         email: payload.email,
         name: {
            first: payload.given_name,
            last: payload.family_name,
         },
      };

      const user = await createOrUpsertUserGoogle(extractedUser);

      req.session.user = user;

      res.status(201).json({
         error: false,
         msg: "User created successfully!",
         user,
      });
   } catch (error) {
      res.status(400).json({ message: "Signin Failed" });
      console.error("Error verifying token:", error);
   }
});

router.post("/logout", (req, res) => {
   req.session.destroy();
   res.json({ msg: "Logged out!" });
});

export default router;
