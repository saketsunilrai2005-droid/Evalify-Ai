const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const logger = require('../utils/logger');

const PdfService = {
  /**
   * Extract text from a PDF file.
   */
  async extractText(filePath) {
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);
    return data.text;
  },

  /**
   * Convert PDF pages to base64 images for Gemini Vision.
   * Gemini supports PDF format natively via application/pdf MIME type.
   */
  async toBase64(filePath) {
    const buffer = fs.readFileSync(filePath);
    const ext = path.extname(filePath).toLowerCase();

    let mediaType;
    if (ext === '.pdf') {
      mediaType = 'application/pdf';
    } else if (ext === '.jpg' || ext === '.jpeg') {
      mediaType = 'image/jpeg';
    } else if (ext === '.png') {
      mediaType = 'image/png';
    } else if (ext === '.webp') {
      mediaType = 'image/webp';
    } else {
      throw new Error(`Unsupported file type: ${ext}`);
    }

    const base64 = buffer.toString('base64');
    
    // Log file info for debugging
    logger.info(`Converted ${path.basename(filePath)} to base64 (type: ${mediaType}, size: ${base64.length} chars)`);

    return {
      type: mediaType,
      data: base64,
    };
  },

  /**
   * Convert multiple files to base64 array.
   */
  async filesToBase64(filePaths) {
    const results = [];
    for (const fp of filePaths) {
      try {
        const b64 = await this.toBase64(fp);
        results.push(b64);
      } catch (err) {
        logger.warn(`Skipping file ${fp}: ${err.message}`);
      }
    }
    return results;
  },

  /**
   * Clean up uploaded files from disk.
   */
  cleanup(filePaths) {
    for (const fp of filePaths) {
      try {
        if (fs.existsSync(fp)) {
          fs.unlinkSync(fp);
        }
      } catch (err) {
        logger.warn(`Failed to cleanup ${fp}: ${err.message}`);
      }
    }
  },
};

module.exports = PdfService;
