import React from "react";

export default function LegalLayout({ children }: React.PropsWithChildren) {
  return (
    <main className="py-4">
      {children}

      <p className="text-center text-sm text-muted-foreground">
        Please review these documents carefully before using the service. The{" "}
        <span className="font-medium text-foreground">
          Terms and Conditions
        </span>{" "}
        and <span className="font-medium text-foreground">Privacy Policy</span>{" "}
        are provided for transparency and user trust.
      </p>
    </main>
  );
}
