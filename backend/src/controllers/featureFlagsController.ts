import { Request, Response } from 'express';
import * as featureFlags from '../lib/featureFlags';

export const getFlags = async (_req: Request, res: Response) => {
  const flags = await featureFlags.getFeatureFlags();
  res.json({ features: flags });
};

export const isEnabled = async (req: Request, res: Response) => {
  const name = String(req.params.name || '');
  const enabled = await featureFlags.isFeatureEnabled(name, false);
  res.json({ feature: name, enabled });
};
