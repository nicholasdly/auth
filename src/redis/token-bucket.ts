import { redis } from ".";

const hash = await redis.scriptLoad(`
local key = KEYS[1]
local max = tonumber(ARGV[1])
local refillIntervalSeconds = tonumber(ARGV[2])
local cost = tonumber(ARGV[3])
local now = tonumber(ARGV[4])

local data = redis.call("HMGET", key, "count", "refilled_at")
local count = tonumber(data[1]) or max - cost
local refilledAt = tonumber(data[2]) or now

local refill = math.floor((now - refilledAt) / refillIntervalSeconds)
if refill > 0 then
  count = math.min(count + refill, max)
end

if count < cost then
	return {0}
end

count = count - cost

redis.call("HSET", key, "count", count, "refilled_at", now)
redis.call("EXPIRE", key, (max - count) * refillIntervalSeconds)

return {1}
`);

export class TokenBucket {
  private storageKey: string;

  public max: number;
  public refillRate: number;

  /**
   * Implementation of a refilling token bucket rate limiter using Redis. Each
   * request is given a bucket of tokens that gets refilled at a set interval.
   * A token is removed on every request until none is left and the request is
   * rejected.
   * @param storageKey A unique identifier for the token bucket.
   * @param max Maximum number of tokens stored in the bucket.
   * @param refillRate The number of seconds to wait before restoring one token.
   */
  constructor(storageKey: string, max: number, refillRate: number) {
    this.storageKey = storageKey;
    this.max = max;
    this.refillRate = refillRate;
  }

  /**
   * Enforces the token bucket rate limit for a specified request.
   * @param key A unique identifier for the request.
   * @param cost The number of tokens to consume for the request.
   * @returns `boolean` indicating whether the request should be allowed.
   */
  public async consume(key: string, cost: number): Promise<boolean> {
    const keys = [`${this.storageKey}:${key}`];
    const args = [
      this.max.toString(),
      this.refillRate.toString(),
      cost.toString(),
      Math.floor(Date.now() / 1000).toString(),
    ];

    const [result]: number[] = await redis.evalsha(hash, keys, args);

    return Boolean(result);
  }
}
