import { PokemonReferralCard } from "@/components/ui/referral/PokemonReferralCard";

export default function Page() {

    const mockAccount = {
  id: "wallet-123-456",
  displayName: "Nexus Explorer",
  walletAddress: "G-1234...ABCD",
  network: "mainnet",
  createdAt: new Date(),
  updatedAt: new Date(),
  lastLoginAt: new Date(),

  // Progress
  level: 42,
  experience: 9000,
  totalPoints: 5000,
  demosCompleted: ["demo1", "demo2"],
  badgesEarned: ["badge1"],
  clappedDemos: [],

  // Quest
  completedQuests: [],
  questProgress: {},

  // Optional Profile Data (Good to add so the card looks populated)
  profile: {
    username: "CryptoMaster",
    displayName: "Nexus Explorer",
    level: 42,
    totalPoints: 5000,
    experience: 9000,
  },
  
  stats: {
    streakDays: 7,
    totalPoints: 5000,
  }
};
    return(
        <div className="max-w-4xl w-full">
        <PokemonReferralCard 
          account={mockAccount} 
        />
      </div>
    )
}