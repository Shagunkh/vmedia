const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.render('aboutus');
});

module.exports = router; // ✅ You forgot this
