import * as dotenv from 'dotenv';
dotenv.config();
import { envsafe, port, str, url } from 'envsafe';

export const env = envsafe({
  NODE_ENV: str({
    devDefault: 'development',
    choices: ['development', 'test', 'production'],
  }),
  REDISHOST: str(),
  REDISPORT: port(),
  REDISUSER: str(),
  REDISPASSWORD: str(),
  PORT: port({
    devDefault: 5000,
  }),
  RAILWAY_STATIC_URL: str({
    devDefault: 'http://localhost:5000',
  }),

  BOLTFUN_NOSTR_PRIVATE_KEY: str(),
  BF_SERVERLESS_SERVICE_URL: url(),
  BF_SERVERLESS_SERVICE_USERNAME: str(),
  BF_SERVERLESS_SERVICE_PASS: str(),
  BF_RELAY_USERNAME: str(),
  BF_RELAY_PASS: str(),

  DISCORD_NOTIFICATIONS_WEBHOOK_URL: url(),

  EMAILS_SERVICE_URL: url(),
  EMAILS_SERVICE_USERNAME: str(),
  EMAILS_SERVICE_PASSWORD: str(),

  MEILISEARCH_HOST: str(),
  MEILISEARCH_API_KEY: str(),
});
