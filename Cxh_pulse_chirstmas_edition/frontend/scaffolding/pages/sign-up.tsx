import { CONFIG } from '../../src/config-global';

import { SignUpView } from '../sections/auth';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <title>{`Request Approval - ${CONFIG.appName}`}</title>

      <SignUpView />
    </>
  );
}
