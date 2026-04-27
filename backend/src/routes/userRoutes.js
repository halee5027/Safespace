const express = require("express");
const router = express.Router();

// GET /api/users
router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Users route working from router 🚀"
  });
});

module.exports = router;