const Anthropic = require('@anthropic-ai/sdk');
const { ANTHROPIC_API_KEY } = require('./env');

const claude = new Anthropic({
  apiKey: ANTHROPIC_API_KEY,
});

module.exports = claude;
