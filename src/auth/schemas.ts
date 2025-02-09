import { z } from "zod";

export const loginFormSchema = z
  .object({
    identifier: z.string().min(1, "Please enter a valid username or email."),
    password: z.string().min(1, "Please enter a valid password."),
  })
  .strict();

export const registerFormSchema = z
  .object({
    username: z
      .string()
      .trim()
      .min(4, "Your username must be at least 4 characters.")
      .max(15, "Your username cannot exceed 15 characters.")
      .refine((username) => /^[A-Za-z0-9_]+$/.test(username), {
        message:
          "Your username can only contain letters, numbers, and underscores.",
      }),
    email: z.string().email("Please enter a valid email address."),
    password: z
      .string()
      .min(6, "Your password must be at least 6 characters.")
      .max(255, "Your password cannot exceed 255 characters."),
  })
  .strict();

export const verificationFormSchema = z
  .object({
    code: z
      .string()
      .trim()
      .length(6, "Please enter the verification code sent to your email."),
  })
  .strict();
