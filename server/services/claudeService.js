const claude = require('../config/claude');
const logger = require('../utils/logger');

const ClaudeService = {
  /**
   * Send images + prompt to Claude Vision API for evaluation.
   * @param {string} prompt - The evaluation prompt text
   * @param {Array<{type: string, data: string}>} images - Base64 encoded images
   * @returns {string} Raw text response from Claude
   */
  async evaluate(prompt, images = []) {
    const content = [];

    // Add images as base64 content blocks
    for (const img of images) {
      content.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: img.type,
          data: img.data,
        },
      });
    }

    // Add the text prompt
    content.push({ type: 'text', text: prompt });

    logger.info(`Sending ${images.length} image(s) to Claude for evaluation`);

    const response = await claude.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content,
        },
      ],
    });

    const textBlock = response.content.find((block) => block.type === 'text');

    if (!textBlock) {
      throw new Error('No text response from Claude');
    }

    logger.info('Claude evaluation response received', {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    });

    return textBlock.text;
  },

  /**
   * Extract questions from a question paper image.
   */
  async extractQuestions(images, prompt) {
    return this.evaluate(prompt, images);
  },
};

module.exports = ClaudeService;
