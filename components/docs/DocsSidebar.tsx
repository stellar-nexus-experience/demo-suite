'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface DocsSidebarProps {
    isOpen: boolean;
    onToggle: () => void;
    initialTab?: 'developer' | 'founder';
}

export const DocsSidebar = ({ isOpen, onToggle, initialTab = 'developer' }: DocsSidebarProps) => {
    const [activeTab, setActiveTab] = useState<'developer' | 'founder'>(initialTab);
    const [activeSection, setActiveSection] = useState('starters');

    // Update active tab when initialTab prop changes
    useEffect(() => {
        setActiveTab(initialTab);
        // Set appropriate default section based on tab
        if (initialTab === 'developer') {
            setActiveSection('starters');
        } else {
            setActiveSection('stellar-guide');
        }
    }, [initialTab]);

    // Handle escape key to close sidebar
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onToggle();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen, onToggle]);

    // Developer sections
    const developerSections = [
        { id: 'starters', title: 'Starter Kits', icon: '👨🏻‍💻' },
        { id: 'vibecoding', title: 'Vibecoding Prompts', icon: '✨' },
    ];

    // Founder sections
    const founderSections = [
        { id: 'stellar-guide', title: 'Stellar Guide', icon: '⭐' },
        { id: 'vibecoding', title: 'Vibecoding Guide', icon: '✨' },
    ];

    const sections = activeTab === 'developer' ? developerSections : founderSections;

    return (
        <>
            {/* Overlay */}
            {isOpen && (
                <div
                    className='fixed inset-0 bg-black/50 backdrop-blur-sm z-40'
                    onClick={onToggle}
                />
            )}

            {/* Sidebar */}
            <div
                className={`
        fixed top-0 right-0 h-full z-50 transform transition-all duration-500 ease-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        w-full lg:w-[600px]
        bg-gradient-to-b from-slate-900/98 to-slate-800/98 backdrop-blur-2xl
        border-l border-white/30 shadow-2xl
        shadow-[-20px_0_60px_rgba(0,0,0,0.8)]
      `}
            >
                {/* Header */}
                <div className='flex items-center justify-between p-4 border-b border-white/20'>
                    <div className='flex items-center space-x-2'>
                        <Image
                            src='/images/logo/iconletter.png'
                            alt='STELLAR NEXUS'
                            width={80}
                            height={16}
                            style={{ width: 'auto', height: 'auto' }}
                        />
                        <span className='text-xs text-white/60'>Starter Kits</span>
                    </div>

                    <button
                        onClick={onToggle}
                        className='text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-300 hover:scale-110 p-2'
                        title='Close Documentation'
                    >
                        <div className='transform transition-transform duration-300 text-2xl'>×</div>
                    </button>
                </div>

                {/* Tab Navigation */}
                <div className='flex justify-center p-4 border-b border-white/20'>
                    <div className='bg-white/10 rounded-xl p-1 border border-white/20 inline-flex'>
                        <button
                            onClick={() => {
                                setActiveTab('developer');
                                setActiveSection('starters');
                            }}
                            className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${activeTab === 'developer'
                                ? 'bg-gradient-to-r from-brand-500 to-accent-600 text-white shadow-lg'
                                : 'text-white/70 hover:text-white'
                                }`}
                        >
                            <span className='mr-2'>👨🏻‍💻</span>
                            Developer
                        </button>
                        <button
                            onClick={() => {
                                setActiveTab('founder');
                                setActiveSection('stellar-guide');
                            }}
                            className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${activeTab === 'founder'
                                ? 'bg-gradient-to-r from-brand-500 to-accent-600 text-white shadow-lg'
                                : 'text-white/70 hover:text-white'
                                }`}
                        >
                            <span className='mr-2'>🚀</span>
                            Founder
                        </button>
                    </div>
                </div>

                {/* Section Navigation */}
                <div className='flex flex-wrap justify-center gap-2 p-4 border-b border-white/20'>
                    {sections.map(section => (
                        <button
                            key={section.id}
                            onClick={() => {
                                if (section.id !== 'vibecoding') {
                                    setActiveSection(section.id);
                                }
                            }}
                            disabled={section.id === 'vibecoding'}
                            className={`px-4 py-2 rounded-xl font-semibold transition-all duration-300 relative text-sm ${activeSection === section.id
                                ? 'bg-gradient-to-r from-brand-500 to-accent-600 text-white shadow-lg'
                                : section.id === 'vibecoding'
                                    ? 'bg-white/5 text-white/40 cursor-not-allowed'
                                    : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
                                }`}
                        >
                            <span className='mr-2'>{section.icon}</span>
                            {section.title}
                            {section.id === 'vibecoding' && (
                                <span className='absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-xs font-bold px-2 py-1 rounded-full shadow-lg animate-pulse'>
                                    Soon
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className='flex-1 overflow-y-auto p-6' style={{ maxHeight: 'calc(100vh - 250px)' }}>
                    {/* Content will be rendered based on activeTab and activeSection */}
                    {activeTab === 'developer' && activeSection === 'starters' && <StarterKitsContent />}
                    {activeTab === 'founder' && activeSection === 'stellar-guide' && <StellarGuideContent />}
                    {activeSection === 'vibecoding' && <VibecodingContent />}
                </div>

                {/* Footer */}
                <div className='p-4 border-t border-white/20'>
                    <div className='text-center'>
                        <p className='text-brand-300/70 text-sm font-medium'>
                            Powered by <span className='text-brand-200 font-semibold'>Trustless Work</span>
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
};

// Content Components
const StarterKitsContent = () => (
    <div className='space-y-8'>
        <div className='text-center mb-8'>
            <h2 className='text-3xl font-bold text-white mb-4'>👨🏻‍💻 Nexus Starters</h2>
            <p className='text-lg text-white/80 max-w-2xl mx-auto'>
                Build on Stellar with Trustless Work — comprehensive starter kits for innovative apps using
                advanced escrow mechanics and enhanced Stellar integrations.
            </p>
        </div>

        <div className='grid md:grid-cols-1 gap-6'>
            {/* DeFi Starter */}
            <div className='bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-400/30 rounded-2xl p-6 hover:border-cyan-400/50 transition-all duration-300 group relative'>
                <div className='absolute top-4 right-4 z-10'>
                    <span className='bg-gradient-to-r from-amber-500 to-orange-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg animate-pulse'>
                        🔜 Coming Soon
                    </span>
                </div>

                <div className='text-center mb-4'>
                    <div className='text-4xl mb-3 group-hover:scale-110 transition-transform duration-300'>
                        💎
                    </div>
                    <h4 className='text-xl font-bold text-white mb-2'>DeFi Starter</h4>
                    <p className='text-white/70 text-sm mb-4'>
                        Create decentralized financial apps with escrow contracts and yield optimization.
                    </p>
                </div>

                <div className='space-y-2 mb-4'>
                    <div className='flex items-center text-sm text-cyan-300'>
                        <span className='mr-2'>•</span>
                        <span>Yield farming protocols</span>
                    </div>
                    <div className='flex items-center text-sm text-cyan-300'>
                        <span className='mr-2'>•</span>
                        <span>Liquidity provision</span>
                    </div>
                    <div className='flex items-center text-sm text-cyan-300'>
                        <span className='mr-2'>•</span>
                        <span>Cross-chain bridges</span>
                    </div>
                    <div className='flex items-center text-sm text-cyan-300'>
                        <span className='mr-2'>•</span>
                        <span>Risk management tools</span>
                    </div>
                </div>

                <button
                    disabled
                    className='block w-full bg-gradient-to-r from-gray-500 to-gray-600 text-white/50 font-semibold py-3 px-4 rounded-xl transition-all duration-300 cursor-not-allowed text-center'
                >
                    💎 Explore DeFi Starter
                </button>
            </div>

            {/* Gaming Starter */}
            <div className='bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-400/30 rounded-2xl p-6 hover:border-purple-400/50 transition-all duration-300 group relative'>
                <div className='absolute top-4 right-4 z-10'>
                    <span className='bg-gradient-to-r from-amber-500 to-orange-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg animate-pulse'>
                        🔜 Coming Soon
                    </span>
                </div>

                <div className='text-center mb-4'>
                    <div className='text-4xl mb-3 group-hover:scale-110 transition-transform duration-300'>
                        🎮
                    </div>
                    <h4 className='text-xl font-bold text-white mb-2'>Gaming Starter</h4>
                    <p className='text-white/70 text-sm mb-4'>
                        Build play-to-earn games with secure escrow for tournaments, rewards, and trading.
                    </p>
                </div>

                <div className='space-y-2 mb-4'>
                    <div className='flex items-center text-sm text-purple-300'>
                        <span className='mr-2'>•</span>
                        <span>Tournament prize pools</span>
                    </div>
                    <div className='flex items-center text-sm text-purple-300'>
                        <span className='mr-2'>•</span>
                        <span>NFT marketplace integration</span>
                    </div>
                    <div className='flex items-center text-sm text-purple-300'>
                        <span className='mr-2'>•</span>
                        <span>Cross-game asset transfers</span>
                    </div>
                    <div className='flex items-center text-sm text-purple-300'>
                        <span className='mr-2'>•</span>
                        <span>Automated reward distribution</span>
                    </div>
                </div>

                <button
                    disabled
                    className='block w-full bg-gradient-to-r from-gray-500 to-gray-600 text-white/50 font-semibold py-3 px-4 rounded-xl transition-all duration-300 cursor-not-allowed text-center'
                >
                    🎮 Explore Gaming Starter
                </button>
            </div>

            {/* Unicorn Starter */}
            <div className='bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-400/30 rounded-2xl p-6 hover:border-green-400/50 transition-all duration-300 group relative'>
                <div className='absolute top-4 right-4 z-10'>
                    <span className='bg-gradient-to-r from-amber-500 to-orange-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg animate-pulse'>
                        🔜 Coming Soon
                    </span>
                </div>

                <div className='text-center mb-4'>
                    <div className='text-4xl mb-3 group-hover:scale-110 transition-transform duration-300'>
                        🦄
                    </div>
                    <h4 className='text-xl font-bold text-white mb-2'>Unicorn Starter</h4>
                    <p className='text-white/70 text-sm mb-4'>
                        Build &quot;unicorn&quot; apps with cutting-edge features and disruptive tech.
                    </p>
                </div>

                <div className='space-y-2 mb-4'>
                    <div className='flex items-center text-sm text-green-300'>
                        <span className='mr-2'>•</span>
                        <span>AI-powered features</span>
                    </div>
                    <div className='flex items-center text-sm text-green-300'>
                        <span className='mr-2'>•</span>
                        <span>Cross-chain interoperability</span>
                    </div>
                    <div className='flex items-center text-sm text-green-300'>
                        <span className='mr-2'>•</span>
                        <span>Advanced tokenomics</span>
                    </div>
                    <div className='flex items-center text-sm text-green-300'>
                        <span className='mr-2'>•</span>
                        <span>Revolutionary UX/UI</span>
                    </div>
                </div>

                <button
                    disabled
                    className='block w-full bg-gradient-to-r from-gray-500 to-gray-600 text-white/50 font-semibold py-3 px-4 rounded-xl transition-all duration-300 cursor-not-allowed text-center'
                >
                    🦄 Explore Unicorn Starter
                </button>
            </div>
        </div>

        <div className='bg-gradient-to-br from-brand-500/20 to-brand-400/20 rounded-xl p-6 border border-brand-400/30'>
            <h3 className='text-2xl font-bold text-white mb-4'>🚀 Getting Started</h3>
            <div className='grid md:grid-cols-2 gap-6'>
                <div>
                    <h4 className='font-semibold text-brand-300 mb-3'>Quick Start</h4>
                    <ul className='text-white/80 text-sm space-y-2'>
                        <li>• Clone the starter repository</li>
                        <li>• Install dependencies with npm</li>
                        <li>• Configure your Stellar wallet</li>
                        <li>• Deploy to your preferred platform</li>
                    </ul>
                </div>
                <div>
                    <h4 className='font-semibold text-accent-300 mb-3'>Features Included</h4>
                    <ul className='text-white/80 text-sm space-y-2'>
                        <li>• Pre-configured Trustless Work integration</li>
                        <li>• Stellar wallet connection setup</li>
                        <li>• Example escrow contracts</li>
                        <li>• TypeScript support and documentation</li>
                    </ul>
                </div>
            </div>
        </div>
        <br />
        <br />
        <br />
    </div>
);

const TrustlessWorkContent = () => (
    <div className='space-y-8'>
        <div className='text-center mb-8'>
            <h2 className='text-3xl font-bold text-white mb-4'>🔐 Trustless Work Guide</h2>
            <p className='text-lg text-white/80 max-w-3xl mx-auto'>
                Everything founders need to know about Trustless Work mechanics, escrow systems, and
                building decentralized work platforms on Stellar.
            </p>
        </div>

        <div className='grid md:grid-cols-2 gap-8'>
            {/* What is Trustless Work */}
            <div className='space-y-6'>
                <h3 className='text-2xl font-bold text-brand-300'>🚀 What is Trustless Work?</h3>
                <div className='space-y-4'>
                    <div className='bg-gradient-to-br from-brand-500/20 to-brand-400/20 rounded-lg p-4 border border-brand-400/30'>
                        <h4 className='font-semibold text-white mb-2'>🔐 Smart Contract Escrow</h4>
                        <p className='text-white/80 text-sm'>
                            Automated fund management with programmable logic. No intermediaries, no trust required
                            - just code and blockchain security.
                        </p>
                    </div>
                    <div className='bg-gradient-to-br from-success-500/20 to-success-400/20 rounded-lg p-4 border border-success-400/30'>
                        <h4 className='font-semibold text-white mb-2'>⚡ Instant Payments</h4>
                        <p className='text-white/80 text-sm'>
                            Built on Stellar&apos;s fast, low-cost network. Payments settle in 3-5 seconds with minimal
                            fees.
                        </p>
                    </div>
                    <div className='bg-gradient-to-br from-accent-500/20 to-accent-400/20 rounded-lg p-4 border border-accent-400/30'>
                        <h4 className='font-semibold text-white mb-2'>🌐 Global Access</h4>
                        <p className='text-white/80 text-sm'>
                            Borderless transactions, no geographic restrictions, and 24/7 availability for global
                            teams.
                        </p>
                    </div>
                </div>
            </div>

            {/* Business Benefits */}
            <div className='space-y-6'>
                <h3 className='text-2xl font-bold text-accent-300'>💼 Business Benefits</h3>
                <div className='space-y-4'>
                    <div className='bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg p-4 border border-purple-400/30'>
                        <h4 className='font-semibold text-white mb-2'>💰 Cost Reduction</h4>
                        <p className='text-white/80 text-sm'>
                            Eliminate payment processing fees, reduce administrative overhead, and automate
                            financial workflows.
                        </p>
                    </div>
                    <div className='bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg p-4 border border-cyan-400/30'>
                        <h4 className='font-semibold text-white mb-2'>⚡ Speed & Efficiency</h4>
                        <p className='text-white/80 text-sm'>
                            Instant settlements, automated milestone tracking, and reduced time-to-payment cycles.
                        </p>
                    </div>
                    <div className='bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-lg p-4 border border-green-400/30'>
                        <h4 className='font-semibold text-white mb-2'>🛡️ Risk Mitigation</h4>
                        <p className='text-white/80 text-sm'>
                            Built-in dispute resolution, time-locked releases, and multi-signature security for
                            complex projects.
                        </p>
                    </div>
                </div>
            </div>
        </div>

        {/* Implementation Guide */}
        <div className='bg-gradient-to-br from-white/5 to-white/10 rounded-xl p-6 border border-white/20'>
            <h3 className='text-2xl font-bold text-white mb-6'>🛠️ Getting Started</h3>
            <div className='grid md:grid-cols-4 gap-4'>
                <div className='text-center p-4 bg-gradient-to-br from-brand-500/20 to-brand-400/20 rounded-lg border border-brand-400/30'>
                    <div className='text-3xl mb-3'>1️⃣</div>
                    <h4 className='font-semibold text-white mb-2'>Understand the Concept</h4>
                    <p className='text-white/80 text-sm'>
                        Learn how smart contract escrow works and its benefits for your business.
                    </p>
                </div>
                <div className='text-center p-4 bg-gradient-to-br from-success-500/20 to-success-400/20 rounded-lg border border-success-400/30'>
                    <div className='text-3xl mb-3'>2️⃣</div>
                    <h4 className='font-semibold text-white mb-2'>Choose Your Use Case</h4>
                    <p className='text-white/80 text-sm'>
                        Identify projects, services, or work that can benefit from escrow mechanics.
                    </p>
                </div>
                <div className='text-center p-4 bg-gradient-to-br from-accent-500/20 to-accent-400/20 rounded-lg border border-accent-400/30'>
                    <div className='text-3xl mb-3'>3️⃣</div>
                    <h4 className='font-semibold text-white mb-2'>Plan Your Integration</h4>
                    <p className='text-white/80 text-sm'>
                        Design workflows, define milestones, and plan dispute resolution processes.
                    </p>
                </div>
                <div className='text-center p-4 bg-gradient-to-br from-warning-500/20 to-warning-400/20 rounded-lg border border-warning-400/30'>
                    <div className='text-3xl mb-3'>4️⃣</div>
                    <h4 className='font-semibold text-white mb-2'>Launch & Scale</h4>
                    <p className='text-white/80 text-sm'>
                        Deploy your solution, onboard users, and scale your trustless work platform.
                    </p>
                </div>
            </div>
        </div>
    </div>
);

const StellarGuideContent = () => (
    <div className='space-y-8'>
        <div className='text-center mb-8'>
            <h2 className='text-3xl font-bold text-white mb-4'>⭐ Stellar Guide</h2>
            <p className='text-lg text-white/80 max-w-3xl mx-auto'>
                Learn about Stellar blockchain, its advantages for business applications, and how it powers
                Trustless Work mechanics.
            </p>
        </div>

        <div className='grid md:grid-cols-2 gap-8'>
            {/* Stellar Advantages */}
            <div className='space-y-6'>
                <h3 className='text-2xl font-bold text-brand-300'>🌟 Why Stellar?</h3>
                <div className='space-y-4'>
                    <div className='bg-gradient-to-br from-brand-500/20 to-brand-400/20 rounded-lg p-4 border border-brand-400/30'>
                        <h4 className='font-semibold text-white mb-2'>⚡ Fast & Cheap</h4>
                        <p className='text-white/80 text-sm'>
                            3-5 second finality with ultra-low fees (~$0.000001 per transaction). Perfect for
                            high-volume applications.
                        </p>
                    </div>
                    <div className='bg-gradient-to-br from-success-500/20 to-success-400/20 rounded-lg p-4 border border-success-400/30'>
                        <h4 className='font-semibold text-white mb-2'>🌍 Global Reach</h4>
                        <p className='text-white/80 text-sm'>
                            Built for cross-border payments with native multi-asset support and regulatory
                            compliance features.
                        </p>
                    </div>
                    <div className='bg-gradient-to-br from-accent-500/20 to-accent-400/20 rounded-lg p-4 border border-accent-400/30'>
                        <h4 className='font-semibold text-white mb-2'>🔄 Interoperability</h4>
                        <p className='text-white/80 text-sm'>
                            Seamless integration with traditional financial systems and other blockchain networks.
                        </p>
                    </div>
                </div>
            </div>

            {/* Business Applications */}
            <div className='space-y-6'>
                <h3 className='text-2xl font-bold text-accent-300'>💼 Business Applications</h3>
                <div className='space-y-4'>
                    <div className='bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg p-4 border border-purple-400/30'>
                        <h4 className='font-semibold text-white mb-2'>💳 Payment Processing</h4>
                        <p className='text-white/80 text-sm'>
                            Process payments, subscriptions, and recurring transactions with minimal fees and
                            instant settlement.
                        </p>
                    </div>
                    <div className='bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg p-4 border border-cyan-400/30'>
                        <h4 className='font-semibold text-white mb-2'>🏦 Banking Services</h4>
                        <p className='text-white/80 text-sm'>
                            Build banking solutions, remittances, and financial services with regulatory
                            compliance.
                        </p>
                    </div>
                    <div className='bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-lg p-4 border border-green-400/30'>
                        <h4 className='font-semibold text-white mb-2'>🔐 Escrow Services</h4>
                        <p className='text-white/80 text-sm'>
                            Implement smart contract escrow for freelancing, e-commerce, and service-based
                            businesses.
                        </p>
                    </div>
                </div>
            </div>
        </div>

        {/* Stellar Ecosystem */}
        <div className='bg-gradient-to-br from-warning-500/20 to-warning-400/20 rounded-xl p-6 border border-warning-400/30'>
            <h3 className='text-2xl font-bold text-white mb-4'>🌐 Stellar Ecosystem</h3>
            <div className='grid md:grid-cols-3 gap-6'>
                <div>
                    <h4 className='font-semibold text-warning-300 mb-3'>Core Assets</h4>
                    <ul className='text-white/80 text-sm space-y-2'>
                        <li>
                            • <strong>XLM:</strong> Native currency for fees and operations
                        </li>
                        <li>
                            • <strong>USDC:</strong> USD-pegged stablecoin for stable value
                        </li>
                        <li>
                            • <strong>Custom Assets:</strong> Create your own tokens
                        </li>
                        <li>
                            • <strong>Anchors:</strong> Fiat currency gateways
                        </li>
                    </ul>
                </div>
                <div>
                    <h4 className='font-semibold text-warning-300 mb-3'>Development Tools</h4>
                    <ul className='text-white/80 text-sm space-y-2'>
                        <li>
                            • <strong>Stellar SDK:</strong> Core development library
                        </li>
                        <li>
                            • <strong>Horizon API:</strong> Blockchain data access
                        </li>
                        <li>
                            • <strong>Laboratory:</strong> Testing and experimentation
                        </li>
                        <li>
                            • <strong>Network Explorer:</strong> Transaction monitoring
                        </li>
                    </ul>
                </div>
                <div>
                    <h4 className='font-semibold text-warning-300 mb-3'>Integration Partners</h4>
                    <ul className='text-white/80 text-sm space-y-2'>
                        <li>
                            • <strong>Circle:</strong> USDC issuer and payments
                        </li>
                        <li>
                            • <strong>MoneyGram:</strong> Global remittances
                        </li>
                        <li>
                            • <strong>IBM:</strong> Enterprise blockchain solutions
                        </li>
                        <li>
                            • <strong>Banking Partners:</strong> Traditional finance integration
                        </li>
                    </ul>
                </div>
            </div>
        </div>
        <br />
        <br />
        <br />
    </div>
);

const VibecodingContent = () => (
    <div className='space-y-8'>
        <div className='text-center mb-8'>
            <h2 className='text-3xl font-bold text-white mb-4'>✨ Vibecoding Guide</h2>
            <p className='text-lg text-white/80 max-w-3xl mx-auto'>
                The modern approach to building with rhythm, creativity, and flow. Learn how to code with
                vibes, not just syntax.
            </p>
        </div>

        <div className='bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-xl p-8 border border-yellow-400/30 text-center'>
            <div className='text-6xl mb-4'>🚧</div>
            <h3 className='text-2xl font-bold text-white mb-4'>Coming Soon!</h3>
            <p className='text-white/70 text-lg'>
                We&apos;re crafting an amazing vibecoding experience. Stay tuned for comprehensive guides,
                prompts, and workflows.
            </p>
        </div>
    </div>
);
