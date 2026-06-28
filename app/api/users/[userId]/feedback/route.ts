import { saveUserFeedbackRequest } from "../../../../../server/routes/users";

export async function POST(
  request: Request,
  context: { params: Promise<{ userId: string }> },
) {
  const { userId } = await context.params;
  return saveUserFeedbackRequest(request, userId);
}
