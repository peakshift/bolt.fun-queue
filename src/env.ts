import * as dotenv from 'dotenv'; // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
dotenv.config();
import { envsafe, port, str } from 'envsafe';

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
  BF_SERVERLESS_SERVICE_USERNAME: str(),
  BF_SERVERLESS_SERVICE_PASS: str(),
});
