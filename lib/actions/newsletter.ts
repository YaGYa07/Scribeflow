"use server";

import { z } from "zod";

import { subscribeEmailToNewsletter } from "@/lib/db/queries";

export type NewsletterFormState = {
  errors?: string[];
  message: string | null;
  subscribed: boolean;
  status: "idle" | "success" | "error";
};

const emailSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address."),
});

export async function subscribeToNewsletter(
  _: NewsletterFormState,
  formData: FormData
): Promise<NewsletterFormState> {
  const parsed = emailSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return {
      errors: parsed.error.issues.map((issue) => issue.message),
      message: null,
      subscribed: false,
      status: "error",
    };
  }

  try {
    const created = await subscribeEmailToNewsletter(parsed.data.email);

    return created ?
        {
          errors: [],
          message: "You have successfully subscribed to our newsletter.",
          subscribed: true,
          status: "success",
        }
      : {
          errors: [],
          message: "This email is already subscribed.",
          subscribed: true,
          status: "success",
        };
  } catch (error) {
    console.error((error as Error).message);
    return {
      errors: [],
      message: "Something went wrong while subscribing.",
      subscribed: false,
      status: "error",
    };
  }
}
