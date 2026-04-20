import { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import db from '../db/database'; // Adjust as needed for your user DB

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleAuth = async (req: Request, res: Response) => {
  const { token } = req.body;
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload) throw new Error('Invalid Google token');

    // Find or create user in your DB
    let user = await db.User.findOne({ where: { email: payload.email } });
    if (!user) {
      user = await db.User.create({
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
        provider: 'google',
      });
    }
    res.json({ user });
  } catch (err) {
    res.status(401).json({ error: 'Google authentication failed' });
  }
};
