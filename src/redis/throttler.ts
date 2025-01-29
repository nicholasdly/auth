import { redis } from ".";

const hash = await redis.scriptLoad(`
local key = KEYS[1]
local now = tonumber(ARGV[1])

local timeoutSeconds = {1, 2, 4, 8, 16, 30, 60, 180, 300}

local data = redis.call("HMGET", key, "index", "updated_at")
local index = tonumber(data[1]) or 1
local updatedAt = tonumber(data[2]) or 0

if updatedAt == 0 then
    redis.call("HSET", key, "index", 1, "updated_at", now)
    return {1}
end

local allowed = now - updatedAt >= timeoutSeconds[index]
if not allowed then
    return {0}
end

index = math.min(index + 1, #timeoutSeconds)
redis.call("HSET", key, "index", index, "updated_at", now)
return {1}
`);

export class Throttler {
  private storageKey: string;

  /**
   * Implementation of a throttling rate limiter using Redis. Throttlers work by
   * enforcing a hardcoded number of seconds to pass between each request to be
   * considered successful.
   * @param storageKey A unique identifier for the throttler.
   */
  constructor(storageKey: string) {
    this.storageKey = storageKey;
  }

  /**
   * Enforces the throttling rate limit for a specified request.
   * @param key A unique identifier for the request.
   * @returns `boolean` indicating whether the request should be allowed.
   */
  public async consume(key: string): Promise<boolean> {
    const keys = [`${this.storageKey}:${key}`];
    const args = [Math.floor(Date.now() / 1000).toString()];

    const [result]: number[] = await redis.evalsha(hash, keys, args);

    return Boolean(result);
  }

  /**
   * Resets the throttling rate limit for a specified request.
   * @param key A unique identifier for the request.
   */
  public async reset(key: string): Promise<void> {
    await redis.del(`${this.storageKey}:${key}`);
  }
}
