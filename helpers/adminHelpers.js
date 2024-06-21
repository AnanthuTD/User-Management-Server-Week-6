import collections from "../config/collections.js";
import { getDB } from "../config/connection.js";
import { objId } from "./mongoHelpers.js";

export async function getAllUsers() {
   const db = getDB();

   return await db
      .collection(collections.ACCOUNTS)
      .find({}, { projection: { password: 0 } })
      .toArray({});
}

export async function getUserById(id) {
   const db = getDB();

   return await db.collection(collections.ACCOUNTS).findOne({ _id: objId(id) });
}

export async function deleteUserById(id) {
   const db = getDB();

   return await db
      .collection(collections.ACCOUNTS)
      .deleteOne({ _id: objId(id) });
}

export async function updateUserById(user) {
   const db = getDB();

   return await db
      .collection(collections.ACCOUNTS)
      .updateOne({ _id: objId(user._id) }, { $set: { name: user.name } });
}
