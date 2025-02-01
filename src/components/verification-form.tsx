"use client";

import { REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { verifyEmail } from "@/auth/actions/verify-email";
import { verificationFormSchema } from "@/auth/schemas";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { zodResolver } from "@hookform/resolvers/zod";

export function VerificationForm() {
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof verificationFormSchema>>({
    resolver: zodResolver(verificationFormSchema),
    defaultValues: {
      code: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof verificationFormSchema>) => {
    startTransition(() => {
      verifyEmail(values).then(({ message }) => toast.error(message));
    });
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-4"
      >
        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <InputOTP
                  containerClassName="justify-center h-fit"
                  pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
                  maxLength={6}
                  spellCheck={false}
                  onComplete={form.handleSubmit(onSubmit)}
                  disabled={isPending}
                  autoFocus
                  {...field}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </FormControl>
              <FormMessage className="text-center" />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isPending}>
          Submit
        </Button>
      </form>
    </Form>
  );
}
