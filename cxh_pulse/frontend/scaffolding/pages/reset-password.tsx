import { CONFIG } from '../../src/config-global';

import { ResetPasswordView } from '../sections/auth';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <title>{`Forgot Password - ${CONFIG.appName}`}</title>

      <ResetPasswordView />
    </>
  );
}
