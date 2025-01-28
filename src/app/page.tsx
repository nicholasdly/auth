import Link from "next/link";

import { logout } from "@/auth/actions";
import { getCurrentSession } from "@/auth/session";
import { Button } from "@/components/ui/button";

export default async function Page() {
  const { session, user } = await getCurrentSession();

  return (
    <main className="mx-auto flex h-dvh max-w-sm flex-col items-center justify-center gap-4 p-4">
      {session ? (
        <>
          <p>
            Logged in as: <span className="font-semibold">{user.username}</span>
          </p>
          <Button size="sm" variant="outline" onClick={logout}>
            Sign out
          </Button>
        </>
      ) : (
        <>
          <p>You are not logged in.</p>
          <Button size="sm" asChild>
            <Link href="/login">Sign in</Link>
          </Button>
        </>
      )}
    </main>
  );
}
