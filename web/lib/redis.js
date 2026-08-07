import { Redis } from "@upstash/redis";

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

let redisClient = null;

function hasValidRedisConfig() {
  return Boolean(url && token && url.startsWith("https://"));
}

export function getRedisClient() {
  if (!hasValidRedisConfig()) {
    return null;
  }

  if (!redisClient) {
    redisClient = new Redis({
      url,
      token,
    });
  }

  return redisClient;
}

export const redis = {
  async get(...args) {
    const client = getRedisClient();

    if (!client) {
      return null;
    }

    return client.get(...args);
  },

  async set(...args) {
    const client = getRedisClient();

    if (!client) {
      return null;
    }

    return client.set(...args);
  },

  async del(...args) {
    const client = getRedisClient();

    if (!client) {
      return null;
    }

    return client.del(...args);
  },
};

export default redis;
