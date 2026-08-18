import "server-only";

import { notFound, redirect } from "next/navigation";

import { authorizeDataSteward } from "./authorization";

export async function requireDataStewardPage() {
  const authorization = await authorizeDataSteward();
  if (!authorization.authorized) {
    if (authorization.reason === "unauthenticated") redirect("/login");
    notFound();
  }
  return authorization;
}
