const jwt = require("jsonwebtoken");

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"]; // Expect "Bearer <token>"
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      message: "No token provided, please login.",
      redirect: "/login",
    });
  }

  jwt.verify(token, process.env.JWT_SECRET || "default_secret", (err, user) => {
    if (err) {
      return res.status(403).json({
        message: "Token expired or invalid, please login again.",
        redirect: "/login",
      });
    }
    req.user = user; // Attach decoded user info to request
    next();
  });
}

module.exports = authenticateToken;
