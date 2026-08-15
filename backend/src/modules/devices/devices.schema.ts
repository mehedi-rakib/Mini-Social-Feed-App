import { z } from "zod";

export const deviceTokenSchema = z.object({
  token: z.string().min(1),
  platform: z.literal("ANDROID").optional(),
});

export type DeviceTokenInput = z.infer<typeof deviceTokenSchema>;
