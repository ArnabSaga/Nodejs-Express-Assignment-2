import { Request, Response } from "express";

import { userServices } from "./user.service";

import { AuthRequest } from "../../middleware/authMiddleware";

const getAllUser = async (req: AuthRequest, res: Response) => {
  try {
    const result = await userServices.getAllUser();

    res.status(200).json({
      success: true,
      message: "Users retrieved successfully",
      data: result.rows,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const updateUser = async (req: AuthRequest, res: Response) => {
  const userIdToUpdate = req.params.id;
  const authenticatedUser = req.user;

  if (!authenticatedUser) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const isOwner = authenticatedUser.id === userIdToUpdate;
  const isAdmin = authenticatedUser.role === "admin";

  if (!isOwner && !isAdmin) {
    return res.status(403).json({
      success: false,
      message: "Forbidden: You are not authorized to modify this profile.",
    });
  }

  const { name, email, phone, role, password } = req.body;

  if (!isAdmin && role) {
    return res.status(403).json({
      success: false,
      message: "Forbidden: Only an admin can change a user's role.",
    });
  }

  try {
    const result = await userServices.updateUser({
      name,
      email,
      phone,
      role,
      password,
      id: userIdToUpdate as string,
    });

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
    } else {
      res.status(200).json({
        success: true,
        message: "User updated successfully",
        data: result.rows[0],
      });
    }
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err.message,
      details: err.constraint,
    });
  }
};

const deleteUser = async (req: AuthRequest, res: Response) => {
  const userIdToDelete = req.params.id as string;

  try {
    const result = await userServices.deleteUser(userIdToDelete);

    if (result && "status" in result) {
      return res.status(result.status).json(result.body);
    }

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err.message,
      details: err,
    });
  }
};

export const userControllers = {
  getAllUser,
  updateUser,
  deleteUser,
};
