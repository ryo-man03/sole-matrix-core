import { registerUserRequest } from "../../../../server/routes/users";

export async function POST(request: Request) {
  return registerUserRequest(request);
}
