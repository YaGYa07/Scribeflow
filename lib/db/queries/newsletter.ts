"use server";

import { db } from "..";
import { newsletterSubscribers } from "../schema";

export async function subscribeEmailToNewsletter(email: string) {
  const [insertedSubscriber] = await db
    .insert(newsletterSubscribers)
    .values({ email })
    .onConflictDoNothing({ target: newsletterSubscribers.email })
    .returning();

  return Boolean(insertedSubscriber);
}
