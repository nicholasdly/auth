import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentSession } from "@/auth/session";

import { RegisterForm } from "./form";

export default async function Page() {
  const { session } = await getCurrentSession();

  if (session) redirect("/");

  return (
    <main className="mx-auto flex h-dvh max-w-sm items-center p-4">
      <div className="flex w-full flex-col gap-8">
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-xl font-semibold">Create an account</h1>
          <p className="text-sm text-muted-foreground">
            Create an account username and password.
          </p>
        </div>
        <RegisterForm />
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?&nbsp;
          <Link
            href="/login"
            className="font-semibold text-foreground hover:underline"
          >
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
