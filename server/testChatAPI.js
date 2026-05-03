const dotenv = require('dotenv');
dotenv.config();
const mongoose = require('mongoose');
const Ticket = require('./models/Ticket');
const User = require('./models/User');
const { chatWithAI } = require('./controllers/ticketController');

const test = async () => {
  await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
  
  // Find a student
  const student = await User.findOne({ role: 'student' });
  if (!student) {
    console.log('No student found');
    process.exit(0);
  }

  // Create a dummy ticket
  const ticket = await Ticket.create({
    title: 'Dummy Wifi Issue',
    description: 'Wifi is completely dead',
    category: 'Technical Issues',
    priority: 'Medium',
    userId: student._id,
    conversation: [
      { role: 'user', content: 'Wifi is completely dead' },
      { role: 'ai', content: 'Step 1: Check your router.' }
    ],
    aiAttempts: 1,
    aiActive: true
  });

  console.log('Created dummy ticket:', ticket._id);

  // Mock req and res
  const req = {
    params: { id: ticket._id.toString() },
    body: { message: 'Still not working after checking router' },
    user: { _id: student._id }
  };

  const res = {
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    json: function(data) {
      console.log(`Response status ${this.statusCode}:`, JSON.stringify(data, null, 2));
    }
  };

  const next = (err) => console.error('Next called with error:', err);

  await chatWithAI(req, res, next);
  
  await Ticket.findByIdAndDelete(ticket._id);
  console.log('Cleaned up dummy ticket');
  process.exit(0);
};

test();
