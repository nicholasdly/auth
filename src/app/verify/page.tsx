import { redirect } from "next/navigation";

import { getCurrentSession } from "@/auth/session";
import { Button } from "@/components/ui/button";
import { VerificationForm } from "@/components/verification-form";

export default async function Page() {
  const { user } = await getCurrentSession();

  if (!user || user.verifiedAt) redirect("/");

  return (
    <main className="mx-auto flex h-dvh max-w-sm items-center p-4">
      <div className="flex w-full flex-col gap-4">
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-nowrap text-xl font-semibold">
            Verify your email
          </h1>
          <p className="text-pretty text-center text-sm text-muted-foreground">
            Check your email for your verification code to complete your
            registration.
          </p>
        </div>
        <VerificationForm />
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Didn&apos;t receive an email?&nbsp;
          <Button variant="link" className="h-fit p-0">
            Resend code
          </Button>
        </p>
      </div>
    </main>
  );
}
