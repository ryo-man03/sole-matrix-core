import { createUserMemoryService } from "../../app/_lib/user-memory/userMemoryService";

export const userMemoryService = createUserMemoryService();

export type UserMemoryService = typeof userMemoryService;
