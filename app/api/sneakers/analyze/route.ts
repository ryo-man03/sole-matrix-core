import { analyzeSneakerRequest } from "../../../../server/routes/analyzeSneaker";

export async function POST(request: Request) {
  return analyzeSneakerRequest(request);
}
