import express from "express";
import {
   deleteUserById,
   getAllUsers,
   getUserById,
   updateUserById,
} from "../helpers/adminHelpers.js";
const router = express.Router();

router.get("/user", async (req, res) => {
   try {
      const users = await getAllUsers();
      res.json({ users, error: false });
   } catch (error) {
      res.json({ error: false, msg: error.message || "Something went wrong!" });
   }
});

router.patch("/user", async (req, res) => {
   const { user } = req.body;
   if (!(user && user._id))
      return res
         .status(400)
         .json({ error: true, msg: "User _id not provided" });

   try {
      const updatedUsr = await updateUserById(user);
      let message = updatedUsr.matchedCount
         ? "User updated successfully"
         : "No matches found!";
      res.json({ error: false, msg: message, count: updatedUsr.modifiedCount });
   } catch (error) {
      res.json({ error: true, msg: error.message || "Something went wrong!" });
   }
});

router.delete("/user", async (req, res) => {
   const { user } = req.body;
   if (!(user && user._id))
      return res.status(400).json({ error: true, msg: "Provide a user ID" });

   const User = await getUserById(user._id);
   if (!User)
      return res.status(400).json({ error: true, msg: "Invalid user ID" });

   if (User?.role === "admin")
      return res.status(403).json({
         error: true,
         msg: "You do not have permission to delete another admin",
      });
   try {
      const result = await deleteUserById(user._id);
      console.log(result);
      res.json({ error: false, msg: "User deleted successfully" });
   } catch (error) {
      res.json({ error: true, msg: error.message || "Something went wrong!" });
   }
});

export default router;
