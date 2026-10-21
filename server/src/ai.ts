import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { db } from './db.js';
import { SupportedLanguage } from '../../shared/types.js';
import { 
  processSaathiChat, 
  getSaathiProviderStatus, 
  generatePropertyComparison,
  STATUTORY_GUIDANCE 
} from './saathiAiService.js';
import { authenticateUser, AuthenticatedRequest } from './middleware.js';

export const aiRouter = Router();
aiRouter.use(authenticateUser);

// Rate limiter for Saathi AI endpoints (30 requests per minute per client)
const AI_RATE_WINDOW_MS = 60 * 1000;
const AI_MAX_REQUESTS_PER_WINDOW = 30;
const clientRequestTimestamps: Map<string, number[]> = new Map();

function checkAiRateLimit(clientId: string): boolean {
  const now = Date.now();
  const timestamps = clientRequestTimestamps.get(clientId) || [];
  const validTimestamps = timestamps.filter(t => now - t < AI_RATE_WINDOW_MS);

  if (validTimestamps.length >= AI_MAX_REQUESTS_PER_WINDOW) {
    clientRequestTimestamps.set(clientId, validTimestamps);
    return false;
  }

  validTimestamps.push(now);
  clientRequestTimestamps.set(clientId, validTimestamps);
  return true;
}

/**
 * GET /api/ai/status
 * Discloses honest AI provider status, model configuration, and engine details.
 */
aiRouter.get('/status', (req: Request, res: Response) => {
  try {
    const status = getSaathiProviderStatus();
    return res.json({
      success: true,
      status,
    });
  } catch (error) {
    console.error('Error in GET /api/ai/status:', error);
    return res.status(500).json({ success: false, error: 'Internal server error checking AI status.' });
  }
});

/**
 * GET /api/ai/prompts
 * Returns curated prompt suggestions for rental search, guidance, comparison, and fraud defense.
 */
aiRouter.get('/prompts', (req: Request, res: Response) => {
  const lang = (req.query.language as SupportedLanguage) || 'en';
  
  const prompts = [
    {
      id: 'p1',
      title: lang === 'hi' ? 'जम्मू में 2 BHK फ्लैट' : lang === 'hi-en' ? '2 BHK in Jammu under 15k' : '2 BHK in Jammu under ₹15,000',
      query: lang === 'hi' ? 'जम्मू में ₹15,000 के अंदर 2 BHK फ्लैट खोजें' : 'Find a 2 BHK flat for rent in Jammu under ₹15,000',
      category: 'search',
    },
    {
      id: 'p2',
      title: lang === 'hi' ? 'गुरुग्राम में 3 BHK' : lang === 'hi-en' ? 'Gurugram 3 BHK flat' : '3 BHK in Gurugram under ₹40,000',
      query: lang === 'hi' ? 'गुरुग्राम में ₹40,000 के अंदर 3 BHK फ्लैट खोजें' : 'Looking for a 3 BHK in Gurugram under 40000',
      category: 'search',
    },
    {
      id: 'p3',
      title: lang === 'hi' ? 'अधिकतम सिक्योरिटी डिपॉजिट' : lang === 'hi-en' ? 'Max Security Deposit rules' : 'Max Security Deposit under Tenancy Act',
      query: lang === 'hi' ? 'मॉडल टेनेंसी एक्ट के तहत अधिकतम सिक्योरिटी डिपॉजिट कितना है?' : 'What is the maximum security deposit allowed under Model Tenancy Act?',
      category: 'legal',
    },
    {
      id: 'p4',
      title: lang === 'hi' ? 'रेंटल फ्रॉड से बचाव' : lang === 'hi-en' ? 'Fraud warning signs' : 'Rental fraud & scam warning signs',
      query: lang === 'hi' ? 'किराये पर मकान लेने से पहले धोखाधड़ी से कैसे बचें?' : 'What are warning signs of rental fraud or scams before visiting?',
      category: 'safety',
    },
    {
      id: 'p5',
      title: lang === 'hi' ? 'भूमि रिकॉर्ड सत्यापन' : lang === 'hi-en' ? 'Land record verification' : 'How does Griha Saathi verify land records?',
      query: lang === 'hi' ? 'हरियाणा और पंजाब में भूमि रिकॉर्ड का सत्यापन कैसे होता है?' : 'How does Griha Saathi verify land records in Haryana and Punjab?',
      category: 'verification',
    },
  ];

  return res.json({ success: true, prompts });
});

/**
 * POST /api/ai/chat
 * Main conversational assistant endpoint with real database retrieval, structured results, and action handlers.
 */
aiRouter.post('/chat', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const clientId = req.user?.id || req.ip || 'anonymous_client';
    if (!checkAiRateLimit(clientId)) {
      return res.status(429).json({
        success: false,
        error: 'Too many queries. Saathi AI rate limit is 30 requests per minute.',
      });
    }

    const { query, language = 'en' } = req.body;
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Query text is required.' });
    }

    const chatResponse = await processSaathiChat({
      userQuery: query,
      language: language as SupportedLanguage,
      authenticatedUserId: req.user?.id,
    });

    return res.json({
      success: true,
      message: chatResponse,
    });
  } catch (error) {
    console.error('Error in POST /api/ai/chat:', error);
    return res.status(500).json({ success: false, error: 'Internal server error processing Saathi AI chat.' });
  }
});

/**
 * POST /api/ai/compare
 * Side-by-side comparison of 2-4 real property records.
 */
aiRouter.post('/compare', (req: Request, res: Response) => {
  try {
    const { propertyIds } = req.body;
    if (!Array.isArray(propertyIds) || propertyIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'propertyIds array (2 to 4 properties) is required.',
      });
    }

    const comparisonTable = generatePropertyComparison(propertyIds);
    return res.json({
      success: true,
      comparison: comparisonTable,
    });
  } catch (error) {
    console.error('Error in POST /api/ai/compare:', error);
    return res.status(500).json({ success: false, error: 'Internal server error comparing properties.' });
  }
});

// ==============================================================================
// LEGACY COMPATIBILITY ENDPOINT: POST /api/ai/query
// ==============================================================================

interface AiQueryRequest {
  query: string;
  language?: SupportedLanguage;
}

aiRouter.post('/query', async (req: Request, res: Response) => {
  try {
    const { query, language = 'en' } = req.body as AiQueryRequest;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Query is required.' });
    }

    const chatResponse = await processSaathiChat({
      userQuery: query,
      language,
    });

    return res.json({
      success: true,
      id: chatResponse.id,
      text: chatResponse.text,
      timestamp: chatResponse.timestamp,
      properties: chatResponse.properties,
      comparisonTable: chatResponse.comparisonTable,
      actions: chatResponse.actions,
      followUpQuestion: chatResponse.followUpQuestion,
      providerInfo: chatResponse.providerInfo,
      relatedEntities: chatResponse.relatedEntities,
    });
  } catch (error) {
    console.error('Error in Saathi AI legacy query:', error);
    return res.status(500).json({ success: false, error: 'Internal server error processing query.' });
  }
});
