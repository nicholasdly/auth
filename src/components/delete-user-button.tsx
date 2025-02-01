"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { deleteUser } from "@/auth/actions/delete-user";

import { Button } from "./ui/button";

export default function DeleteUserButton() {
  const [isPending, startTransition] = useTransition();

  const onClick = async () => {
    startTransition(() => {
      deleteUser().then(({ message }) => toast.error(message));
    });
  };

  return (
    <Button
      size="sm"
      variant="destructive"
      onClick={onClick}
      disabled={isPending}
    >
      Delete account
    </Button>
  );
}
