const Ticket = require('../models/Ticket');
const User = require('../models/User');
const { getAIResponse, getAIFollowUp, getHandoffSummary } = require('../utils/gemini');
const { createNotification } = require('./notificationController');

const MAX_AI_ATTEMPTS = 4;

// ─── Helpers ────────────────────────────────────────────────────────────────

const SENSITIVE_KEYWORDS = [
  'ragging', 'harassment', 'fight', 'assault', 'abuse',
  'groupism', 'discrimination', 'threat', 'bullying', 'language abuse'
];

const URGENT_KEYWORDS = [
  'urgent', 'not working', 'broken', 'blocked', 'failed', 'error', 'exam', 'deadline'
];

const checkSensitive = (text) => SENSITIVE_KEYWORDS.some(kw => text.toLowerCase().includes(kw));
const checkUrgent = (text) => URGENT_KEYWORDS.some(kw => text.toLowerCase().includes(kw));

const determinePriority = (title, description, isSensitive) => {
  if (isSensitive) return 'Critical';
  const combinedText = `${title} ${description}`;
  if (checkUrgent(combinedText)) return 'High';
  const lowKeywords = ['query', 'suggestion', 'feedback', 'general', 'question'];
  if (lowKeywords.some(kw => combinedText.toLowerCase().includes(kw))) return 'Low';
  return 'Medium';
};

// ─── Controllers ────────────────────────────────────────────────────────────

/**
 * GET /tickets
 * Student: returns only their own tickets
 * Staff/Admin: returns all tickets
 */
const getTickets = async (req, res, next) => {
  try {
    const { status, category, priority, page = 1, limit = 10, sort = 'createdAt' } = req.query;

    const filter = {};
    if (req.user.role === 'student') filter.userId = req.user._id;
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;

    let sortObj = { createdAt: -1 };
    if (sort === 'priority') sortObj = { priority: 1, createdAt: -1 };

    const tickets = await Ticket.find(filter)
      .populate('userId', 'name email role usn employeeId')
      .sort(sortObj)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Ticket.countDocuments(filter);

    return res.status(200).json({
      success: true,
      count: tickets.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
      tickets,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /tickets/:id
 * Returns a single ticket by ID (fresh fetch for modal).
 * Student: only their own. Staff/Admin: any.
 */
const getTicketById = async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('userId', 'name email role usn employeeId');

    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

    // Students can only view their own tickets
    if (req.user.role === 'student' && ticket.userId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    return res.status(200).json({ success: true, ticket });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /tickets/create
 * Creates the ticket and gets the FIRST AI response.
 */
const createTicket = async (req, res, next) => {
  try {
    const { title, description, category } = req.body;

    if (!title || !description || !category) {
      return res.status(400).json({ success: false, message: 'title, description, and category are required' });
    }

    const combinedText = `${title} ${description}`;
    const isSensitive = checkSensitive(combinedText);
    const priority = determinePriority(title, description, isSensitive);

    // Get first AI response
    const firstAIResponse = await getAIResponse(title, description, category, isSensitive);

    // Build the initial conversation thread
    const conversation = [
      { role: 'user', content: description },
      { role: 'ai', content: firstAIResponse },
    ];

    const ticket = await Ticket.create({
      title,
      description,
      category,
      priority,
      isSensitive,
      userId: req.user._id,
      aiResponse: firstAIResponse,  // legacy field
      conversation,
      aiAttempts: 1,           // First AI response counts as attempt #1
      aiActive: !isSensitive && category !== 'Student Welfare & Complaints',
    });

    // Notifications
    await createNotification(req.user._id, `Ticket created: "${title}"`, 'ticket_created');
    if (firstAIResponse) {
      await createNotification(req.user._id, `AI has responded to your ticket: "${title}"`, 'ai_response');
    }

    if (isSensitive) {
      const admins = await User.find({ role: 'admin' });
      await Promise.all(admins.map(admin =>
        createNotification(admin._id, `CRITICAL: Sensitive ticket from ${req.user.name}: "${title}"`, 'high_priority_alert')
      ));
    }

    return res.status(201).json({ success: true, message: 'Ticket created successfully', ticket });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /tickets/:id/chat
 * User replies "No, still need help" and sends a follow-up message.
 * The AI responds (up to MAX_AI_ATTEMPTS total).
 * After the 4th attempt, the ticket is auto-escalated.
 */
const chatWithAI = async (req, res, next) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

    // Only the ticket owner can chat
    if (ticket.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Cannot chat if AI is no longer active
    if (!ticket.aiActive) {
      return res.status(400).json({ success: false, message: 'AI session has ended for this ticket. It has been escalated to an admin.' });
    }

    // Cannot chat if already AT max attempts
    if (ticket.aiAttempts >= MAX_AI_ATTEMPTS) {
      // Force escalation & deactivate AI
      if (ticket.aiActive) {
        ticket.aiActive = false;
        ticket.status = 'Escalated';
        await ticket.save();
      }
      return res.status(400).json({
        success: false,
        message: `Maximum ${MAX_AI_ATTEMPTS} AI responses reached. Your ticket has been escalated to the admin team.`
      });
    }

    // Add the user's message to the conversation
    ticket.conversation.push({ role: 'user', content: message });

    const nextAttempt = ticket.aiAttempts + 1;

    // Get AI follow-up
    const aiReply = await getAIFollowUp(
      ticket.title,
      ticket.category,
      ticket.conversation,
      nextAttempt
    );

    // Add AI reply to conversation
    ticket.conversation.push({ role: 'ai', content: aiReply });
    ticket.aiAttempts = nextAttempt;
    ticket.updatedAt = Date.now();

    // If this was the final attempt, automatically escalate
    if (nextAttempt >= MAX_AI_ATTEMPTS) {
      ticket.aiActive = false;
      // Keep status as Open so admin decides when to act
    }

    await ticket.save();

    // Notify user of AI reply
    await createNotification(req.user._id, `AI has replied to your ticket: "${ticket.title}"`, 'ai_response');

    return res.status(200).json({ success: true, ticket });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /tickets/:id/resolve
 * User clicks "Yes, Issue Resolved" → closes the ticket themselves.
 */
const resolveTicket = async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

    // Only the ticket owner can self-resolve
    if (ticket.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    ticket.status = 'Closed';
    ticket.aiActive = false;
    ticket.updatedAt = Date.now();
    await ticket.save();

    await createNotification(req.user._id, `You closed ticket: "${ticket.title}"`, 'status_update');

    return res.status(200).json({ success: true, message: 'Ticket closed successfully', ticket });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /tickets/:id/escalate
 * User clicks "No, Escalate to Admin" → freezes AI and alerts admins.
 */
const escalateTicket = async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

    if (ticket.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Generate handoff summary for the admin
    const handoffSummary = await getHandoffSummary(ticket.title, ticket.category, ticket.conversation);

    ticket.status = 'Escalated';
    ticket.aiActive = false;
    if (handoffSummary) {
      ticket.adminResponse = `[AI Handoff Summary for Admin]\n${handoffSummary}`;
    }
    ticket.updatedAt = Date.now();
    await ticket.save();

    // Notify user
    await createNotification(
      ticket.userId,
      `Your ticket "${ticket.title}" has been escalated to the admin team.`,
      'status_update'
    );

    // Notify all admins
    const admins = await User.find({ role: 'admin' });
    await Promise.all(admins.map(admin =>
      createNotification(
        admin._id,
        `Escalated ticket requires attention: "${ticket.title}" from ${req.user.name}`,
        'high_priority_alert'
      )
    ));

    return res.status(200).json({ success: true, message: 'Ticket escalated to admin', ticket });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /tickets/:id/status
 * Staff/Admin: manually update status
 */
const updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!['Open', 'In Progress', 'Escalated', 'Closed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

    ticket.status = status;
    ticket.updatedAt = Date.now();
    await ticket.save();

    await createNotification(ticket.userId, `Your ticket status has been updated to: ${status}`, 'status_update');

    return res.status(200).json({ success: true, ticket });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /tickets/:id/reply
 * Staff/Admin: add manual admin response
 */
const replyTicket = async (req, res, next) => {
  try {
    const { adminResponse } = req.body;

    if (!adminResponse) {
      return res.status(400).json({ success: false, message: 'adminResponse is required' });
    }

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

    ticket.adminResponse = adminResponse;
    ticket.updatedAt = Date.now();
    await ticket.save();

    await createNotification(ticket.userId, `An admin has replied to your ticket: "${ticket.title}"`, 'admin_reply');

    return res.status(200).json({ success: true, ticket });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /tickets/:id/priority
 * Admin only: update priority
 */
const updatePriority = async (req, res, next) => {
  try {
    const { priority } = req.body;

    if (!['Low', 'Medium', 'High', 'Critical'].includes(priority)) {
      return res.status(400).json({ success: false, message: 'Invalid priority' });
    }

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

    ticket.priority = priority;
    ticket.updatedAt = Date.now();
    await ticket.save();

    return res.status(200).json({ success: true, ticket });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getTickets,
  getTicketById,
  createTicket,
  chatWithAI,
  resolveTicket,
  escalateTicket,
  updateStatus,
  replyTicket,
  updatePriority,
};
