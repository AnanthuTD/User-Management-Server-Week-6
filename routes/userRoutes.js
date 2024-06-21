import express from "express";
import { hashPassword } from "../helpers/authHelpers.js";
import { createUser } from "../helpers/userHelpers.js";
const router = express.Router();

router.post("/register", async (req, res) => {
   const userData = req.body;

   console.log(userData);

   if (!(userData.email && userData.password)) {
      res.json({ error: true, msg: "Email and password are required!" });
      return;
   }

   let hashedPassword = undefined;

   try {
      hashedPassword = hashPassword({ password: userData.password });
   } catch (error) {
      console.error(error);
      res.json({ error: true, msg: "Failed to has password!" });
      return;
   }

   const newUser = {
      name:{firstName: userData.firstName, lastName: userData.lastName},
      email: userData.email,
      password: hashedPassword,
   };

   try {
      await createUser(newUser);
   } catch (error) {
      if (error.code === 11000)
         res.json({ error: true, msg: "User with this email already exist!" });
      else {
         res.json({ error: true, msg: "Failed to create user!" });
         console.error(error);
      }
      console.error(error);
      return;
   }
   res.json({ error: false, msg: "User created successfully!" });
});

export default router;
