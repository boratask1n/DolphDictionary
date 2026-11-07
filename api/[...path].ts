import type { Request, Response } from "express";
import { createApp } from "../server";

let appPromise: ReturnType<typeof createApp> | null = null;

export default async function handler(req: Request, res: Response): Promise<void> {
  appPromise ||= createApp();
  const app = await appPromise;
  app(req, res);
}
