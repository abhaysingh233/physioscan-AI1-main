import { Router, Request, Response, NextFunction } from "express";
import { body, validationResult } from "express-validator";
import xss from "xss";
import { analyzeSymptoms, getDiet, getRemedies } from "../controllers/healthController";
import { analyzeAyurveda } from "../controllers/ayurvedaController";

const router = Router();

// Validation Middleware Helper
const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }
  next();
};

router.post("/analyze-symptoms", [
  body('symptoms').trim().notEmpty().withMessage('Symptoms are required').customSanitizer(value => xss(value)),
  body('age').optional().isInt({ min: 1, max: 120 }).withMessage('Age must be a valid number'),
  body('gender').optional().trim().customSanitizer(value => xss(value)),
  body('language').optional().trim().customSanitizer(value => xss(value)),
  validate
], analyzeSymptoms);

router.post("/get-diet", [
  body('condition').trim().notEmpty().withMessage('Condition is required').customSanitizer(value => xss(value)),
  body('language').optional().trim().customSanitizer(value => xss(value)),
  validate
], getDiet);

router.post("/get-remedies", [
  body('condition').trim().notEmpty().withMessage('Condition is required').customSanitizer(value => xss(value)),
  body('language').optional().trim().customSanitizer(value => xss(value)),
  validate
], getRemedies);

router.post("/ayurveda/analyze", [
  body('query').trim().notEmpty().withMessage('Query is required').customSanitizer(value => xss(value)),
  body('language').optional().trim().customSanitizer(value => xss(value)),
  validate
], analyzeAyurveda);

export default router;
