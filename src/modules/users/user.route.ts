import express from "express";

import { userControllers } from "./user.controller";

import { authenticate, AuthRequest } from "../../middleware/authMiddleware";
import { authorize } from "../../middleware/authorize";

const router = express.Router();

const ADMIN = "admin";

//* Create user CRUD
// router.post("/", userControllers.createUser);

//* Get ALl the user CRUD
router.get("/", authenticate, authorize(ADMIN), userControllers.getAllUser);

//* Get single the user CRUD
// router.get("/:id", userControllers.getSingleUser);

//* user update CRUD
router.put("/:id", authenticate, userControllers.updateUser);

//* user delete CRUD
router.delete(
  "/:id",
  authenticate,
  authorize(ADMIN),
  userControllers.deleteUser
);
export const userRoutes = router;
