"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { logout } from "@/auth/actions/logout";

import { Button } from "./ui/button";

export default function LogoutButton() {
  const [isPending, startTransition] = useTransition();

  const onClick = async () => {
    startTransition(() => {
      logout().then(({ message }) => toast.error(message));
    });
  };

  return (
    <Button size="sm" variant="outline" onClick={onClick} disabled={isPending}>
      Sign out
    </Button>
  );
}
