import { Router } from 'express';
import { googleAuth } from '../controllers/authController';

const router = Router();

router.post('/google', googleAuth);

export default router;
