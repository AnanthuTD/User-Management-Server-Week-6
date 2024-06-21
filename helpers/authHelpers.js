import bcrypt from "bcryptjs";

export function hashPassword({ password }) {
   return bcrypt.hashSync(password);
}

export function comparePassword({ password, hash }) {
   return bcrypt.compareSync(password, hash);
}