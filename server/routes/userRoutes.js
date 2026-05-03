const express = require('express');
const { getUsers, updateUser, deleteUser } = require('../controllers/userController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.patch('/:id', updateUser); // Admin or self

// Admin Only Routes
router.use(restrictTo('admin'));
router.get('/', getUsers);
router.delete('/:id', deleteUser);

module.exports = router;
