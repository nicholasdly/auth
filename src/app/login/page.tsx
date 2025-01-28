import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentSession } from "@/auth/session";

import { SignInForm } from "./form";

export default async function Page() {
  const { session } = await getCurrentSession();

  if (session) redirect("/");

  return (
    <main className="mx-auto flex h-dvh max-w-sm items-center p-4">
      <div className="flex w-full flex-col gap-8">
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-xl font-semibold">Sign in</h1>
          <p className="text-sm text-muted-foreground">
            Log in to your account via username and password.
          </p>
        </div>
        <SignInForm />
        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?&nbsp;
          <Link
            href="/register"
            className="font-semibold text-foreground hover:underline"
          >
            Register
          </Link>
          &nbsp;for free.
        </p>
      </div>
    </main>
  );
}
