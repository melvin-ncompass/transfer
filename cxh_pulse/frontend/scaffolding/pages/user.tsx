import { CONFIG } from '../../src/config-global';
import { UserView } from '../sections/user';
// ---------------------------------------------------------------------

export default function Page() {


  return (
    <>
      <title>{`Users - ${CONFIG.appName}`}</title>
      <UserView />
    </>
  );
}
