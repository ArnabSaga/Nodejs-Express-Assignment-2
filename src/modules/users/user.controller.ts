import { Request, Response } from "express";

import { userServices } from "./user.service";

import { AuthRequest } from "../../middleware/authMiddleware";

/* 
const createUser = async (req: Request, res: Response) => {
  try {
    const result = await userServices.createUser(req.body);
    
    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: "User are created successfully",
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
*/

const getAllUser = async (req: AuthRequest, res: Response) => {
  try {
    const result = await userServices.getAllUser();

    res.status(200).json({
      success: true,
      message: "User retrieved successfully",
      data: result.rows,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* 
const getSingleUser = async (req: Request, res: Response) => {
  try {
    const result = await userServices.getSingleUser(req.params.id as string);
    
    if (result.rows.length === 0) {
      res.status(400).json({
        success: false,
        message: "User not found",
      });
    } else {
      res.status(200).json({
    success: true,
    message: "User fetched successfully",
    data: result.rows[0],
  });
}
} catch (err: any) {
  res.status(500).json({
    success: false,
    message: err.message,
    details: err,
  });
}
};
*/

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

  const { name, email, phone } = req.body;

  try {
    const result = await userServices.updateUser(
      name,
      email,
      phone,
      req.params.id as string
    );

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
      details: err,
    });
  }
};

const deleteUser = async (req: Request, res: Response) => {
  try {
    const result = await userServices.deleteUser(req.params.id as string);

    if ((result.rowCount ?? 0) === 0) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
    } else {
      res.status(200).json({
        success: true,
        message: "User deleted successfully",
        data: result.rows,
      });
    }
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err.message,
      details: err,
    });
  }
};

export const userControllers = {
  // createUser,
  getAllUser,
  // getSingleUser,
  updateUser,
  deleteUser,
};
