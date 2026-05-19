"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import { signIn } from "next-auth/react";
import { toast } from "sonner";

import { Google } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { DEFAULT_LOGIN_REDIRECT } from "@/config/routes";

type OAuthButtonProps = {
  callbackUrl?: string;
  isFormDisabled: boolean;
  setIsSubmitting: React.Dispatch<React.SetStateAction<boolean>>;
};

export function OAuthButtons(props: OAuthButtonProps) {
  const {
    callbackUrl = DEFAULT_LOGIN_REDIRECT,
    isFormDisabled,
    setIsSubmitting,
  } = props;

  const [oauthLoading, setOauthLoading] = React.useState<"google">();

  async function googleSignInHandler() {
    setOauthLoading("google");
    setIsSubmitting(true);

    try {
      await signIn("google", { callbackUrl });
    } catch (error) {
      const err = error as Error;
      console.error(err.message);
      toast.error("Google sign-in failed. Please try again.");
      setIsSubmitting(false);
      setOauthLoading(undefined);
    }
  }

  return (
    <>
      <div className="relative py-2">
        <span className="absolute inset-x-0 inset-y-1/2 border-t" />

        <span className="relative mx-auto flex w-fit bg-background px-2 text-xs uppercase text-muted-foreground transition-colors duration-0">
          Or continue with
        </span>
      </div>

      <div className="mt-6 flex w-full flex-col space-y-2 text-white">
        <Button
          size="sm"
          onClick={googleSignInHandler}
          disabled={isFormDisabled}
          className="w-full font-semibold shadow-md"
        >
          {oauthLoading === "google" ?
            <Loader2 className="mr-2 size-4 animate-spin" />
          : <Google className="mr-2 size-4" />}
          Google
        </Button>
      </div>
    </>
  );
}
