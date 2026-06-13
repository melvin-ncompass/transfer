import { ConfigView } from '../sections/config/view/config-view';

// ----------------------------------------------------------------------

/**
 * Config Page
 * 
 * Simple wrapper component that renders the ConfigView.
 * This page handles routing while the view handles all UI logic.
 */
export default function ConfigPage() {
  return <ConfigView />;
}
