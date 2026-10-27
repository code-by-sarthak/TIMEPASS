import { Router, Request, Response } from 'express';

const router = Router();

// Create a private invite room
router.post('/create', (req: Request, res: Response) => {
  const roomId = `tp_${Math.random().toString(36).substring(2, 8)}_${Math.random().toString(36).substring(2, 6)}`;
  res.json({
    success: true,
    roomId,
    inviteUrl: `/room/${roomId}`
  });
});

export default router;
