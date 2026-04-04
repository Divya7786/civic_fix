const gemini = require('../services/geminiService');
const Complaint = require('../models/Complaint');

const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 20;

function checkRateLimit(ip) {
    const now = Date.now();
    const entry = rateLimitMap.get(ip);
    if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
        rateLimitMap.set(ip, { windowStart: now, count: 1 });
        return true;
    }
    if (entry.count >= RATE_LIMIT_MAX) return false;
    entry.count++;
    return true;
}

/**
 * POST /api/ai/chat
 * Body: { message: string, conversationHistory: Array<{role, text}> }
 */
const chatWithAI = async (req, res, next) => {
    try {
        if (!checkRateLimit(req.ip)) {
            return res.status(429).json({
                success: false,
                error: { message: 'Too many AI requests. Please wait a moment.' }
            });
        }

        const { message, conversationHistory = [] } = req.body;
        if (!message || typeof message !== 'string' || !message.trim()) {
            return res.status(400).json({
                success: false,
                error: { message: 'Message is required' }
            });
        }

        const result = await gemini.chat(message.trim(), conversationHistory);
        res.json({ success: true, data: result });
    } catch (err) {
        next(err);
    }
};

/**
 * POST /api/ai/analyze-description
 * Body: { description: string }
 */
const analyzeDescription = async (req, res, next) => {
    try {
        if (!checkRateLimit(req.ip)) {
            return res.status(429).json({
                success: false,
                error: { message: 'Too many AI requests. Please wait a moment.' }
            });
        }

        const { description } = req.body;
        if (!description || typeof description !== 'string' || description.trim().length < 10) {
            return res.status(400).json({
                success: false,
                error: { message: 'Description must be at least 10 characters' }
            });
        }

        const result = await gemini.analyzeDescription(description.trim());
        if (!result) {
            return res.status(503).json({
                success: false,
                error: { message: 'AI service unavailable' }
            });
        }

        res.json({ success: true, data: result });
    } catch (err) {
        next(err);
    }
};

/**
 * POST /api/ai/enhance-description
 * Body: { description: string }
 */
const enhanceDescription = async (req, res, next) => {
    try {
        if (!checkRateLimit(req.ip)) {
            return res.status(429).json({
                success: false,
                error: { message: 'Too many AI requests. Please wait a moment.' }
            });
        }

        const { description } = req.body;
        if (!description || typeof description !== 'string' || description.trim().length < 10) {
            return res.status(400).json({
                success: false,
                error: { message: 'Description must be at least 10 characters' }
            });
        }

        const enhanced = await gemini.enhanceDescription(description.trim());
        if (!enhanced) {
            return res.status(503).json({
                success: false,
                error: { message: 'AI service unavailable' }
            });
        }

        res.json({ success: true, data: { enhanced } });
    } catch (err) {
        next(err);
    }
};

/**
 * POST /api/ai/check-duplicate
 * Body: { description, latitude, longitude, issueType }
 */
const checkDuplicate = async (req, res, next) => {
    try {
        if (!checkRateLimit(req.ip)) {
            return res.status(429).json({
                success: false,
                error: { message: 'Too many AI requests. Please wait a moment.' }
            });
        }

        const { description, latitude, longitude, issueType } = req.body;
        if (!description || !latitude || !longitude) {
            return res.status(400).json({
                success: false,
                error: { message: 'description, latitude, and longitude are required' }
            });
        }

        const nearby = await Complaint.findNearby(
            Number(latitude), Number(longitude), 0.5
        );

        const openNearby = nearby.filter(c => c.status !== 'Resolved');

        if (openNearby.length === 0) {
            return res.json({ success: true, data: { duplicates: [] } });
        }

        const duplicates = await gemini.checkDuplicates(
            description, issueType || '', openNearby
        );

        res.json({ success: true, data: { duplicates } });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    chatWithAI,
    analyzeDescription,
    enhanceDescription,
    checkDuplicate
};
