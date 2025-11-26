// Force dynamic rendering for this page
export const dynamic = 'force-dynamic';

import MiniGameStore from '@/components/games/MiniGameStore';

export default function MiniGamesPage() {
  // All providers (WalletProvider, FirebaseProvider, ToastProvider, etc.)
  // are already provided globally in RootProviders (app/root.tsx)
  return <MiniGameStore />;
}
