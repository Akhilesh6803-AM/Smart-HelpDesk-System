const { GoogleGenerativeAI } = require('@google/generative-ai');

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

const MAX_AI_ATTEMPTS = 4;

const AI_SYSTEM_PROMPT = `You are an AI assistant for a smart helpdesk.

Rules for your response:
1. Provide your answer strictly in a clear, numbered step-by-step format (e.g., Step 1: ..., Step 2: ...).
2. Do NOT write long paragraphs. Each step should be one concise sentence.
3. Maximum 5 steps. If fewer steps are needed, use fewer.
4. No emojis.
5. Professional and friendly tone.
6. Only answer queries relevant to the user's organization.
7. If the category is "Student Welfare & Complaints" or the issue is flagged as sensitive, respond ONLY with: "This issue has been flagged as high priority and escalated to our admin team immediately."

Guidelines based on category:
- Technical Issues: Provide clear troubleshooting steps.
- Academic Issues: Provide policy info and academic process guidance.
- Project & Documentation: Provide suggestions and format tips.
- Administrative Issues: Explain process and whom to contact.
- Facility & Campus Issues: Explain reporting steps.
- Student Welfare & Complaints: Always escalate (use exact phrase from rule 7).`;

/**
 * Returns a brief suggestion string before ticket creation (used in the form preview)
 */
const getAISuggestion = async (title, description, category) => {
  if (!genAI) return 'AI service is currently unavailable.';
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const prompt = `${AI_SYSTEM_PROMPT}

A user is asking for a quick suggestion before submitting a ticket.
Title: ${title}
Description: ${description}
Category: ${category}

Provide a brief suggestion or quick fix in step-by-step format.`;
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error('Gemini AI Suggestion Error:', error);
    return 'Could not generate an AI suggestion at this time.';
  }
};

/**
 * Returns the FIRST AI response when a ticket is created.
 */
const getAIResponse = async (title, description, category, isSensitive) => {
  if (!genAI) return 'AI service is currently unavailable. An admin will review your ticket shortly.';

  if (isSensitive || category === 'Student Welfare & Complaints') {
    return 'This issue has been flagged as high priority and escalated to our admin team immediately.';
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const prompt = `${AI_SYSTEM_PROMPT}

A user has submitted a new ticket. Provide the initial step-by-step solution.
Title: ${title}
Description: ${description}
Category: ${category}`;
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error('Gemini AI Response Error:', error);
    return 'Our AI assistant is temporarily unavailable. An admin will review your ticket soon.';
  }
};

/**
 * Generates a follow-up AI response given the full conversation history.
 * Called when the user says "No, I need more help" inside a ticket.
 * 
 * @param {string} title - Original ticket title
 * @param {string} category - Ticket category
 * @param {Array<{role: 'user'|'ai', content: string}>} conversation - full thread so far
 * @param {number} attemptNumber - which attempt this is (2, 3, or 4)
 */
const getAIFollowUp = async (title, category, conversation, attemptNumber) => {
  if (!genAI) return 'AI service is currently unavailable. An admin will review your ticket shortly.';

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Build the Gemini chat history from the conversation array
    const history = conversation.slice(0, -1).map(msg => ({
      role: msg.role === 'ai' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    const isFinalAttempt = attemptNumber >= MAX_AI_ATTEMPTS;

    const chat = model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: `${AI_SYSTEM_PROMPT}\n\nThe original ticket title is: "${title}" in category "${category}". Do you understand?` }],
        },
        {
          role: 'model',
          parts: [{ text: 'Yes, I understand. I will provide step-by-step responses and follow all the rules.' }],
        },
        ...history,
      ],
    });

    const latestUserMessage = conversation[conversation.length - 1]?.content || '';

    let systemNote = '';
    if (isFinalAttempt) {
      systemNote = '\n\n[SYSTEM NOTE: This is your FINAL attempt. End your response with: "If this does not resolve your issue, please click Escalate to Admin below so our team can assist you directly."]';
    }

    const result = await chat.sendMessage(latestUserMessage + systemNote);
    return result.response.text();
  } catch (error) {
    console.error('Gemini AI Follow-up Error:', error);
    return 'Our AI assistant is temporarily unavailable. An admin will review your ticket soon.';
  }
};

/**
 * Generates an AI handoff summary for the admin when a ticket is escalated.
 */
const getHandoffSummary = async (title, category, conversation) => {
  if (!genAI) return '';
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const conversationText = conversation
      .map(m => `${m.role === 'user' ? 'User' : 'AI'}: ${m.content}`)
      .join('\n');

    const prompt = `You are summarizing an escalated helpdesk ticket for a human admin.
Ticket: "${title}" (Category: ${category})

Conversation:
${conversationText}

Write a concise 2-3 sentence summary for the admin. Include:
1. The core problem the user faced.
2. What solutions the AI already tried (so the admin doesn't repeat them).
3. What likely needs to be done next.`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error('Gemini Handoff Summary Error:', error);
    return '';
  }
};

/**
 * Chatbot interface for general questions (ChatbotWidget)
 * @param {Array} messages - conversation history
 * @param {string} userContext - optional injected user info (name, USN, ticket stats)
 */
const askChatbot = async (messages, userContext = '') => {
  if (!genAI) return 'AI service is currently unavailable.';

  const CHATBOT_SYSTEM_PROMPT = `You are an AI assistant for the Smart Helpdesk. You help users with queries related to their organization (college or company).

RESPONSE FORMAT RULES (very important):
1. Analyze the question type FIRST, then choose the format:
   - "How to" / troubleshooting / step-by-step tasks → Use numbered steps: "Step 1: ...", "Step 2: ..." etc. (max 6 steps)
   - Simple factual questions, personal info queries, short answers → Use a brief paragraph (2-4 sentences max)
   - Lists of options/features → Use bullet points: "- item"
   - Mixed content → Use a short paragraph followed by steps if needed
2. NEVER dump everything in one giant paragraph for a step-by-step question.
3. Keep each step or bullet to ONE clear sentence.
4. Use **bold** for important terms or keywords.
5. Professional but friendly tone. No emojis in answers.

PERSONAL INFORMATION:
- If the user asks about their name, email, USN, employee ID, role, or ticket statistics, use ONLY the data in the [LOGGED-IN USER CONTEXT] section below. Answer directly.
- If no context is provided (guest user), politely say they need to log in to see personal info.

TICKET GUIDANCE:
- If a user has a technical issue, academic problem, or complaint that needs human help, ALWAYS end with: "If this doesn't help, you can raise a support ticket at the Tickets page and our staff will assist you."
- If a user asks how to raise a ticket, say: "Go to the **Tickets** page from the navigation bar and click **New Ticket**. Fill in the title, description and category, and our AI will instantly suggest a solution."

ORGANIZATION CONTEXT:
- If a [LOGGED-IN USER CONTEXT] section is present below, use the "Organization" field to refer to the user's specific organization.
- If NO user context is provided (guest user), do NOT mention any specific college or company name. Respond generically (e.g., "your organization" or "your institution").

SCOPE: Only answer organization-related queries (technical issues, administrative processes, facilities, HR, exams, etc.). For unrelated topics, politely redirect.
${userContext}`;

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const history = messages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    const chat = model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: `${CHATBOT_SYSTEM_PROMPT}\n\nDo you understand all the rules?` }],
        },
        {
          role: 'model',
          parts: [{ text: 'Yes, I understand all the rules. I will format responses based on question type (steps for how-to, paragraphs for factual), use provided user context for personal queries, and guide users to raise tickets when needed.' }],
        },
        ...history.slice(0, -1),
      ],
    });

    const lastMessage = history[history.length - 1]?.parts[0]?.text || '';
    if (!lastMessage) return 'No message provided.';

    const result = await chat.sendMessage(lastMessage);
    return result.response.text();
  } catch (error) {
    console.error('Gemini Chatbot Error:', error);
    return 'I am currently experiencing technical difficulties. Please try again later.';
  }
};

module.exports = { getAISuggestion, getAIResponse, getAIFollowUp, getHandoffSummary, askChatbot };

