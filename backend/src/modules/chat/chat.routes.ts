import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { validateBody, validateQuery } from "../../middleware/validate.js";
import { writeLimiter } from "../../middleware/rateLimit.js";
import { startConversationSchema, sendMessageSchema, listMessagesQuerySchema } from "./chat.schema.js";
import {
  listConversationsHandler,
  startConversationHandler,
  getConversationHandler,
  listMessagesHandler,
  sendMessageHandler,
} from "./chat.controller.js";

const router = Router();

router.use(requireAuth);

router.get("/", listConversationsHandler);
router.post("/", writeLimiter, validateBody(startConversationSchema), startConversationHandler);
router.get("/:id", getConversationHandler);
router.get("/:id/messages", validateQuery(listMessagesQuerySchema), listMessagesHandler);
router.post("/:id/messages", writeLimiter, validateBody(sendMessageSchema), sendMessageHandler);

export default router;
