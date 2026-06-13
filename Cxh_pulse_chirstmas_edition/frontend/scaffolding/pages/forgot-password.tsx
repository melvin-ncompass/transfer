import { CONFIG } from '../../src/config-global';

import { ForgotPasswordView } from '../sections/auth';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <title>{`Forgot Password - ${CONFIG.appName}`}</title>

      <ForgotPasswordView />
    </>
  );
}
