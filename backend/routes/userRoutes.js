const express = require("express");
const router = express.Router();

// TEST ROUTE
router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Users route working 🚀"
  });
});

module.exports = router;