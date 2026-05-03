const FAQ = require('../models/FAQ');

/**
 * GET /faqs
 * Public route to get all published FAQs. 
 * Supports ?category=... &search=...
 */
const getFAQs = async (req, res, next) => {
  try {
    const { category, search } = req.query;

    const filter = {};
    
    if (req.query.admin !== 'true') {
      filter.status = 'published';
    }

    if (category) {
      filter.category = category;
    }

    if (search) {
      filter.$or = [
        { question: { $regex: search, $options: 'i' } },
        { answer: { $regex: search, $options: 'i' } },
      ];
    }

    const faqs = await FAQ.find(filter)
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name email role');

    return res.status(200).json({ success: true, count: faqs.length, faqs });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /faqs
 * Admin -> 'published'
 * Staff -> 'pending'
 */
const createFAQ = async (req, res, next) => {
  try {
    const { question, answer, category } = req.body;

    if (!question || !answer || !category) {
      return res.status(400).json({ success: false, message: 'Question, answer, and category are required' });
    }

    const status = req.user.role === 'admin' ? 'published' : 'pending';

    const faq = await FAQ.create({
      question,
      answer,
      category,
      status,
      createdBy: req.user._id,
    });

    return res.status(201).json({ success: true, message: `FAQ created with status: ${status}`, faq });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /faqs/:id
 * Admin only
 */
const updateFAQ = async (req, res, next) => {
  try {
    const faq = await FAQ.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!faq) {
      return res.status(404).json({ success: false, message: 'FAQ not found' });
    }

    return res.status(200).json({ success: true, message: 'FAQ updated', faq });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /faqs/:id
 * Admin only
 */
const deleteFAQ = async (req, res, next) => {
  try {
    const faq = await FAQ.findByIdAndDelete(req.params.id);

    if (!faq) {
      return res.status(404).json({ success: false, message: 'FAQ not found' });
    }

    return res.status(200).json({ success: true, message: 'FAQ deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getFAQs,
  createFAQ,
  updateFAQ,
  deleteFAQ,
};
