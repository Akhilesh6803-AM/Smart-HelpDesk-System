require('dotenv').config();
const { getAIFollowUp } = require('./utils/gemini');

const test = async () => {
  const conversation = [
    { role: 'user', content: 'My wifi is not working' },
    { role: 'ai', content: 'Step 1: Check router.' },
    { role: 'user', content: 'Still not working' },
  ];

  console.log('Testing getAIFollowUp...');
  const result = await getAIFollowUp('Wifi Issue', 'Technical Issues', conversation, 2);
  console.log('Result:', result);
};

test();
