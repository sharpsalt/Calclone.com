import { Request, Response } from 'express';
import * as service from '../services/availabilityService';

export const getAvailability = async (_req: Request, res: Response) => {
  const data = await service.getAvailabilityForDefaultUser();
  res.json(data);
};

export const upsertAvailability = async (req: Request, res: Response) => {
  const created = await service.upsertAvailabilityForDefaultUser(req.body);
  res.json(created);
};

export const listSchedules = async (_req: Request, res: Response) => {
  const rows = await service.listSchedulesForDefaultUser();
  res.json(rows);
};

export const createSchedule = async (req: Request, res: Response) => {
  const created = await service.createScheduleForDefaultUser(req.body);
  res.status(201).json(created);
};

export const getSchedule = async (req: Request, res: Response) => {
  const id = req.params.id;
  const row = await service.getScheduleById(id);
  res.json(row);
};

export const updateSchedule = async (req: Request, res: Response) => {
  const id = req.params.id;
  const updated = await service.updateScheduleById(id, req.body);
  res.json(updated);
};

export const deleteSchedule = async (req: Request, res: Response) => {
  const id = req.params.id;
  await service.deleteScheduleById(id);
  res.status(204).end();
};
