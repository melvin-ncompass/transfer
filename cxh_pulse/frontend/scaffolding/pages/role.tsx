
import { CONFIG } from '../../src/config-global';
import { RoleView } from '../sections/role';

// ----------------------------------------------------------------------

export default function Page() {


  return (
    <>
      <title>{`Roles - ${CONFIG.appName}`}</title>

      <RoleView />
    </>
  );
}
