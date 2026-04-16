import { Request, Response } from 'express';
import * as service from '../services/eventTypeService';

export const list = async (_req: Request, res: Response) => {
  const rows = await service.listEventTypes();
  res.json(rows);
};

export const getBySlug = async (req: Request, res: Response) => {
  const result = await service.getEventTypeBySlug(req.params.slug);
  // allow CDN/public caches to cache this response using stale-while-revalidate
  const shared = Number(process.env.EVENT_CACHE_TTL_SECONDS || 60);
  const stale = Number(process.env.EVENT_STALE_REVALIDATE_SECONDS || Math.max(shared * 5, 300));
  const browserMax = Math.min(shared, 60);
  res.setHeader('Cache-Control', `public, max-age=${browserMax}, s-maxage=${shared}, stale-while-revalidate=${stale}`);
  res.json(result);
};

export const getPublicProfile = async (req: Request, res: Response) => {
  const result = await service.getPublicProfileByUsername(req.params.username);
  const shared = Number(process.env.EVENT_CACHE_TTL_SECONDS || 60);
  const stale = Number(process.env.EVENT_STALE_REVALIDATE_SECONDS || Math.max(shared * 5, 300));
  const browserMax = Math.min(shared, 60);
  res.setHeader('Cache-Control', `public, max-age=${browserMax}, s-maxage=${shared}, stale-while-revalidate=${stale}`);
  res.json(result);
};

export const create = async (req: Request, res: Response) => {
  const created = await service.createEventType(req.body);
  res.status(201).json(created);
};

export const update = async (req: Request, res: Response) => {
  const updated = await service.updateEventType(req.params.id, req.body);
  res.json(updated);
};

export const remove = async (req: Request, res: Response) => {
  await service.deleteEventType(req.params.id);
  res.status(204).end();
};
