import { env } from '../env';

export function validate(
  username: string,
  password: string,
  req: any,
  res: any,
  done: Function
) {
  if (
    !(
      username === env.BF_SERVERLESS_SERVICE_USERNAME &&
      password === env.BF_SERVERLESS_SERVICE_PASS
    ) &&
    !(username === env.BF_RELAY_USERNAME && password === env.BF_RELAY_PASS)
  ) {
    done(new Error('Not Authenticated'));
  } else done();
}
