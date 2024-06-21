// check if user is authorized
export const requireLogin = (req, res, next) => {
   if (!req.session?.user) {
      return res.status(401).json({ message: "Unauthorized" });
   }
   next();
};

// check if user is authorized and admin
export const requireAdmin = (req, res, next) => {
   if (req.session.user?.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
   }
   next();
};
