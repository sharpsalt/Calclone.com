import { Request, Response } from 'express';
import * as service from '../services/usersService';
import { getDefaultUserProfile } from '../config';
import { query } from '../db';
import fs from 'fs';
import path from 'path';

export const update = async (req: Request, res: Response) => {
  const id = req.params.id;
  const payload = req.body || {};
  const updated = await service.updateUserById(id, payload);
  res.json(updated);
};

export const me = async (_req: Request, res: Response) => {
  const profile = await getDefaultUserProfile();
  if (!profile || !profile.id) return res.status(404).json({ error: 'User not found' });
  const q = await query('SELECT id, username, name, timezone, avatar FROM users WHERE id=$1 LIMIT 1', [profile.id]);
  const row = q.rows[0];
  if (!row) return res.status(404).json({ error: 'User not found' });
  const emailsRes = await query('SELECT email, is_primary, verified, created_at FROM user_emails WHERE user_id=$1 ORDER BY is_primary DESC, created_at DESC', [profile.id]);
  res.json({ id: row.id, username: row.username, name: row.name, timezone: row.timezone, avatar: row.avatar, emails: emailsRes.rows });
};

export const uploadAvatar = async (req: Request, res: Response) => {
  const id = req.params.id;
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  // multer stores file at req.file.path
  const filename = path.basename(req.file.path || req.file.filename || '');
  const url = `/uploads/avatars/${filename}`;
  const updated = await service.setAvatar(id, url);
  res.json({ avatar: updated.avatar || url });
};

export const deleteAvatar = async (req: Request, res: Response) => {
  const id = req.params.id;
  const q = await query('SELECT avatar FROM users WHERE id=$1 LIMIT 1', [id]);
  const avatar = q.rows[0]?.avatar;
  await service.clearAvatar(id);
  if (avatar) {
    try {
      const filename = path.basename(avatar);
      const p = path.resolve(__dirname, '..', '..', 'uploads', 'avatars', filename);
      await fs.promises.unlink(p).catch(() => {});
    } catch {}
  }
  res.json({ ok: true });
};

export const listEmails = async (req: Request, res: Response) => {
  const id = req.params.id;
  const rows = await service.listEmails(id);
  res.json(rows);
};

export const addEmail = async (req: Request, res: Response) => {
  const id = req.params.id;
  const email = (req.body || {}).email;
  if (!email) return res.status(400).json({ error: 'Missing email' });
  const row = await service.addEmail(id, String(email).toLowerCase());
  res.json(row);
};

export const removeEmail = async (req: Request, res: Response) => {
  const id = req.params.id;
  const email = req.params.email;
  if (!email) return res.status(400).json({ error: 'Missing email' });
  await service.removeEmail(id, String(email).toLowerCase());
  res.json({ ok: true });
};

export const setPrimaryEmail = async (req: Request, res: Response) => {
  const id = req.params.id;
  const email = req.params.email;
  if (!email) return res.status(400).json({ error: 'Missing email' });
  const rows = await service.setPrimaryEmail(id, String(email).toLowerCase());
  res.json(rows);
};
