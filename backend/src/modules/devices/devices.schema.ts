import { z } from "zod";

export const deviceTokenSchema = z.object({
  token: z.string().min(1),
  platform: z.enum(["ANDROID", "IOS"]).default("ANDROID"),
});

export type DeviceTokenInput = z.infer<typeof deviceTokenSchema>;
