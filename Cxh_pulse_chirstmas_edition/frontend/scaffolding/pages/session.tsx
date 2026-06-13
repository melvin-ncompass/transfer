import { CONFIG } from '../../src/config-global';

import { SessionView } from '../sections/session';

// ----------------------------------------------------------------------

export default function Page() {

  return (
    <>
      <title>{`Roles - ${CONFIG.appName}`}</title>

      <SessionView />
    </>
  );
}