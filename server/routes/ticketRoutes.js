const express = require('express');
const {
  getTickets,
  getTicketById,
  createTicket,
  chatWithAI,
  resolveTicket,
  escalateTicket,
  updateStatus,
  replyTicket,
  updatePriority,
} = require('../controllers/ticketController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();

// All ticket routes require authentication
router.use(protect);

// Public (all authenticated users)
router.get('/', getTickets);
router.get('/:id', getTicketById);  // Fetch single ticket (fresh data for modal)
router.post('/create', createTicket);

// User self-service (ticket owner only — enforced inside controller)
router.post('/:id/chat', chatWithAI);         // Reply to AI for follow-up
router.patch('/:id/resolve', resolveTicket);  // "Yes, issue resolved" — self-close
router.patch('/:id/escalate', escalateTicket); // "No, need human help" — escalate

// Staff and Admin routes
router.patch('/:id/status', restrictTo('staff', 'admin'), updateStatus);
router.patch('/:id/reply', restrictTo('staff', 'admin'), replyTicket);

// Admin only routes
router.patch('/:id/priority', restrictTo('admin'), updatePriority);

module.exports = router;
