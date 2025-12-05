import express from "express";

import { userControllers } from "./user.controller";

const router = express.Router();

//* Create user CRUD
router.post("/", userControllers.createUser);

//* Get ALl the user CRUD
router.get("/", userControllers.getAllUser);

//* Get single the user CRUD
router.get("/:id", userControllers.getSingleUser);

//* user update CRUD
router.put("/:id", userControllers.updateUser);

//* user delete CRUD
router.delete("/:id", userControllers.deleteUser);
export const userRoutes = router;
