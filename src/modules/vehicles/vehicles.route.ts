import express from "express";

import { vehicleControllers } from "./vehicles.controller";

import { authenticate } from "../../middleware/authMiddleware";
import { authorize } from "../../middleware/authorize";

const router = express.Router();

const ADMIN = "admin";

//* Create Vehicle CRUD
router.post(
  "/",
  authenticate,
  authorize(ADMIN),
  vehicleControllers.createVehicle
);

//* Get ALl the Vehicle CRUD
router.get("/", vehicleControllers.getAllVehicle);

//* Get single the Vehicle CRUD
router.get("/:vehicleId", vehicleControllers.getSingleVehicle);

//* Vehicle update CRUD
router.put(
  "/:vehicleId",
  authenticate,
  authorize(ADMIN),
  vehicleControllers.updatedVehicle
);

//* Vehicle delete CRUD
router.delete(
  "/:vehicleId",
  authenticate,
  authorize(ADMIN),
  vehicleControllers.deleteVehicle
);

export const vehiclesRouter = router;
