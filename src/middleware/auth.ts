import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";

/**
 * Authentication Middleware
 */

interface AuthRequest extends Request {
  user?: any;
}

// Verify JWT token
export const verifyToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: "No token provided",
      });
    }

    const token = authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "Invalid token format",
      });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error("JWT_SECRET is not defined");
    }

    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    next();
  } catch (error: any) {
    console.error("JWT Verification Error:", error.message, error.name);
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        error: "Token expired",
      });
    }
    return res.status(401).json({
      success: false,
      error: "Invalid token",
    });
  }
};

// Optional auth - doesn't block if no token
export const optionalAuth = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader) {
      const token = authHeader.split(" ")[1];
      if (token) {
        const secret = process.env.JWT_SECRET;
        if (secret) {
          const decoded = jwt.verify(token, secret);
          req.user = decoded;
        }
      }
    }
    next();
  } catch (error) {
    // Continue without user
    next();
  }
};

// Check if user has specific role
export const requireRole = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    // Superadmins have access to everything
    if (req.user.is_superadmin) {
      return next();
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: "Insufficient permissions",
      });
    }

    next();
  };
};

// API Key authentication (for n8n/webhooks)
export const verifyApiKey = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const apiKey = req.headers["x-api-key"];

  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: "API key required",
    });
  }

  if (apiKey !== process.env.API_KEY) {
    return res.status(401).json({
      success: false,
      error: "Invalid API key",
    });
  }

  next();
};

export default {
  verifyToken,
  optionalAuth,
  requireRole,
  verifyApiKey,
};
