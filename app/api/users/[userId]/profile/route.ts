import { getUserProfileRequest } from "../../../../../server/routes/users";

export async function GET(
  _request: Request,
  context: { params: Promise<{ userId: string }> },
) {
  const { userId } = await context.params;
  return getUserProfileRequest(userId);
}
