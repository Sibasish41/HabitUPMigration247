const express = require('express');
const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    res.json({ message: 'Payment routes - to be implemented' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
