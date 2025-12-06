import { Request, Response } from "express";

import { authServices } from "./auth.service";

const signup = async (req: Request, res: Response) => {
  try {
    const { name, email, password, phone, role } = req.body;

    if (!name || !email || !password || !phone || !role) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: name, email, password, phone, and role.",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }

    if (!["admin", "customer"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role",
      });
    }

    const result = await authServices.signup({
      name,
      email,
      password,
      phone,
      role,
    });

    if (result.status === 409) {
      return res.status(409).json(result.body);
    }

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: result.body.user,
    });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

const signin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const result = await authServices.signin(email, password);

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: result,
    });
  } catch (err: any) {
    res.status(401).json({
      success: false,
      message: err.message,
    });
  }
};

export const authControllers = {
  signup,
  signin,
};
