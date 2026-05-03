const { getAISuggestion, askChatbot } = require('../utils/gemini');

/**
 * POST /ai/suggest
 * Get suggestion before submitting a ticket
 */
const suggest = async (req, res, next) => {
  try {
    const { title, description, category } = req.body;

    if (!title || !description || !category) {
      return res.status(400).json({ success: false, message: 'title, description, and category are required' });
    }

    const suggestion = await getAISuggestion(title, description, category);

    return res.status(200).json({ success: true, suggestion });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /ai/ask
 * Chatbot functionality for general questions
 */
const ask = async (req, res, next) => {
  try {
    const { messages, userContext } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ success: false, message: 'Valid messages array is required' });
    }

    const reply = await askChatbot(messages, userContext || '');

    return res.status(200).json({ success: true, reply });
  } catch (err) {
    next(err);
  }
};

module.exports = { suggest, ask };
