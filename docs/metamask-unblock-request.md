Title: Request to remove phishing warning for stellar-nexus-experience.vercel.app

Summary
- We operate a developer demo site for Trustless Work on Stellar. The site is TESTNET-only, never asks for Secret Recovery Phrase or wallet password, and does not move user mainnet assets. We believe our domain was incorrectly flagged and request review and removal from blocklists.

Domain
- Primary: https://stellar-nexus-experience.vercel.app/

Product purpose
- Interactive demos showing trustless escrow workflows on Stellar (education/sandbox). Not a token sale, airdrop, or verification site.

Key safety measures implemented (code-level)
- TESTNET-only enforcement:
  - Disables programmatic switches to PUBLIC/mainnet in `lib/stellar/stellar-wallet-hooks.ts`.
  - UI network switch to Mainnet is disabled with a “Coming Soon” badge in `components/ui/wallet/NetworkIndicator.tsx`.
  - UI banner and messaging indicate TESTNET-only usage.
- No seed/password collection:
  - No UI fields or endpoints accept Secret Recovery Phrase or wallet password.
- Explicit consent for wallet actions:
  - Wallet prompts only occur on user-initiated clicks. No auto-opening popups.
- “Real but safe” demo flows:
  - Demo 1 (`components/demos/HelloMilestoneDemo.tsx`): Only the initialize step attempts a tiny real TESTNET transaction; subsequent steps are simulated. Added a prominent TESTNET/safety notice.
  - Demo 2 (`components/demos/DisputeResolutionDemo.tsx`) and Demo 3 (`components/demos/MicroTaskMarketplaceDemo.tsx`): Funding/approval/release are simulated. Added a visible “Refund Now” action that resets demo state and an automatic refund option on modal close. No real user funds are moved.
- Refund-on-close UX:
  - `components/ui/modals/ImmersiveDemoModal.tsx` triggers a global refund event on “Refund Now & Exit”; demos listen and reset immediately.
- Transparent transaction display:
  - For any real TESTNET transaction (init step), the UI shows hashes and explorer links.

Files changed (high level)
- `components/demos/HelloMilestoneDemo.tsx`: Added TESTNET/safety banner; labeled steps 2–5 as simulated; added Refund Now.
- `components/demos/DisputeResolutionDemo.tsx`: Added canRefund state, Refund Now button, refund handler, and refund-on-close event listener; simulated steps guaranteed safe.
- `components/demos/MicroTaskMarketplaceDemo.tsx`: Added canRefund state, Refund Now button, refund handler, and refund-on-close event listener; funding/release simulated.
- `components/ui/modals/ImmersiveDemoModal.tsx`: Added “Refund Now & Exit” that triggers global refund event.
- `components/ui/wallet/NetworkIndicator.tsx`: Disabled mainnet switch; “Coming Soon” badge.
- `lib/stellar/stellar-wallet-hooks.ts`: Throws when attempting to switch to PUBLIC (mainnet) to enforce TESTNET-only.

Security headers and transport
- Hosted on Vercel over HTTPS. We can add stricter CSP/HSTS/XFO as needed; site does not include inline scripts that exfiltrate secrets.

Attestations
- We do not ask for SRP (seed phrase) or wallet passwords.
- We do not run mainnet transactions; only TESTNET is allowed.
- We do not initiate transactions without explicit user clicks.
- We do not impersonate other brands; logos/assets are our own.

Request
- Please remove `stellar-nexus-experience.vercel.app` from MetaMask/ChainPatrol/SEAL blocklists or mark as safe. If anything else is needed (extra headers, further copy changes), we will comply promptly.

Contact
- Maintainer: Jose Gomez
- Repo/Code available upon request.


