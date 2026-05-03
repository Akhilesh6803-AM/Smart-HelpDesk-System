const mongoose = require('mongoose');
const dotenv = require('dotenv');
const FAQ = require('../models/FAQ');

dotenv.config({ path: '../.env' });

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smart-helpdesk';

const faqs = [
  {
    question: "How do I reset my student portal password?",
    answer: "If you have forgotten your password, click on the 'Forgot Password' link on the login page. An OTP will be sent to your registered email address. Use the OTP to create a new password. If you still face issues, please raise a ticket under 'Technical Issues'.",
    category: "Technical Issues"
  },
  {
    question: "Where can I find my examination schedule?",
    answer: "The examination schedule is typically posted on the 'Notices' page and the official college website at least two weeks prior to the exams. You will also receive an email notification.",
    category: "Academic Issues"
  },
  {
    question: "What is the procedure to apply for a hostel room?",
    answer: "Hostel applications can be submitted online via the college portal during the admission period. For mid-semester requests, please visit the Administrative block or raise an 'Administrative Issues' ticket to check for vacancy.",
    category: "Facility & Campus Issues"
  },
  {
    question: "How do I report a maintenance issue in my classroom?",
    answer: "You can instantly report broken furniture, AC issues, or projector malfunctions by creating a ticket under 'Facility & Campus Issues'. Our campus management team tracks these requests daily.",
    category: "Facility & Campus Issues"
  },
  {
    question: "Can I change my elective subjects after the semester starts?",
    answer: "Elective changes are only permitted within the first 10 days of the semester. You must submit a signed form to your Head of Department. For digital processing, you can raise an 'Academic Issues' ticket and attach the form.",
    category: "Academic Issues"
  }
];

const seedFAQs = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Get an admin user
    const User = require('../models/User');
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      console.log('No admin user found. Please run createAdmin.js first.');
      process.exit(1);
    }

    // Add createdBy to each FAQ
    const faqsWithUser = faqs.map(faq => ({ ...faq, createdBy: adminUser._id }));

    // Clear existing
    await FAQ.deleteMany({});
    console.log('Cleared existing FAQs');

    // Insert new
    await FAQ.insertMany(faqsWithUser);
    console.log('Successfully added standard FAQs!');

    process.exit(0);
  } catch (err) {
    console.error('Error seeding FAQs:', err);
    process.exit(1);
  }
};

seedFAQs();
