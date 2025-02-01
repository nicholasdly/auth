import { Throttler } from "@/redis/throttler";
import { TokenBucket } from "@/redis/token-bucket";

// All authentication actions share the same token bucket so they can be
// globally rate limited by IP address.
export const authBucket = new TokenBucket("auth", 10, 1);

// Throttler for the `login` server action, forcing the user to wait longer
// between failed attempts. Should be reset after each successful login.
export const loginThrottler = new Throttler("login");

// Resending email verification codes need to be strictly rate limited.
// We use a token bucket here at a rate of 1 token every 30 seconds.
export const emailBucket = new TokenBucket("resend_verification_email", 1, 30);
