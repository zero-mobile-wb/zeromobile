import React, { useState } from 'react';

// Basic JSON layout to HTML mapper for web preview
const LayoutRendererWeb = ({ node }: { node: any }) => {
    if (!node) return null;

    const renderChildren = () => {
        return (node.children || []).map((child: any, idx: number) => (
            <LayoutRendererWeb key={idx} node={child} />
        ));
    };

    switch (node.type) {
        case 'screen':
            return (
                <div className="flex flex-col h-full bg-[#0A0A0F] text-white">
                    <div className="flex items-center p-4 border-b border-gray-800">
                        {node.showBack && <span className="mr-4 text-gray-400">←</span>}
                        <div className="flex-1 text-center font-bold">{node.title}</div>
                        {node.showBack && <span className="ml-4 w-4"></span>}
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                        {renderChildren()}
                    </div>
                </div>
            );

        case 'card':
            return (
                <div className="bg-[#1C1C23] p-4 rounded-xl shadow-lg border border-gray-800 flex flex-col gap-3">
                    {renderChildren()}
                </div>
            );

        case 'button':
            return (
                <button
                    className="w-full py-3 px-4 bg-[#9945FF] text-white rounded-lg font-bold hover:bg-[#8A3EE6] transition disabled:opacity-50"
                    disabled={node.disabled}
                >
                    {node.label || 'Button'}
                </button>
            );

        case 'text':
            return (
                <div className="text-gray-300">
                    {node.value}
                </div>
            );

        case 'stat':
            return (
                <div className="flex justify-between items-center py-2">
                    <span className="text-gray-400">{node.label}</span>
                    <span className={node.highlight ? "text-[#14F195] font-bold" : "text-white font-bold"}>
                        {node.value}
                    </span>
                </div>
            );

        case 'token-badge':
            return (
                <div className="flex items-center gap-2 bg-[#2D2D35] px-3 py-1.5 rounded-full inline-flex">
                    <div className="w-5 h-5 rounded-full bg-blue-500"></div>
                    <span className="text-sm font-bold">{node.balance} {node.label}</span>
                </div>
            );

        case 'input':
            return (
                <input
                    type="text"
                    placeholder={node.placeholder}
                    defaultValue={node.label ? "" : ""}
                    className="w-full bg-[#2D2D35] border border-gray-700 text-white rounded-lg px-4 py-3 outline-none focus:border-[#9945FF]"
                />
            );

        case 'row':
            return <div className="flex flex-row items-center gap-3">{renderChildren()}</div>;

        case 'column':
        case 'list':
            return <div className="flex flex-col gap-3">{renderChildren()}</div>;

        case 'list-item':
            return (
                <div className="flex items-center justify-between py-3 border-b border-gray-800 last:border-0">
                    <div>
                        <div className="text-white font-medium">{node.title}</div>
                        {node.subtitle && <div className="text-gray-400 text-sm">{node.subtitle}</div>}
                    </div>
                    {node.value && <div className="font-bold text-white">{node.value}</div>}
                </div>
            );

        case 'divider':
            return <div className="h-px w-full bg-gray-800 my-2"></div>;

        case 'spinner':
            return <div className="animate-spin w-6 h-6 border-2 border-[#9945FF] border-t-transparent rounded-full mx-auto my-4"></div>;

        default:
            return <div className="text-red-500 text-xs text-center border border-red-500 p-2">Unknown node: {node.type}</div>;
    }
};

const XNFTDevPreview: React.FC = () => {
    const [url, setUrl] = useState('http://localhost:4242');
    const [manifest, setManifest] = useState<any>(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLoad = async () => {
        setLoading(true);
        setError('');
        setManifest(null);
        try {
            const target = url.endsWith('.json') ? url : `${url.replace(/\/$/, '')}/manifest.json`;
            const res = await fetch(target);
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            const data = await res.json();
            setManifest(data);
        } catch (e: any) {
            setError(e.message || 'Failed to fetch manifest');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0b] flex flex-col text-white">
            <header className="bg-[#1C1C23] border-b border-gray-800 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-[#9945FF] flex items-center justify-center font-bold">x</div>
                    <h1 className="text-xl font-bold">xNFT Dev Preview</h1>
                </div>
                <div className="flex gap-2 w-1/2">
                    <input
                        type="text"
                        className="flex-1 bg-black border border-gray-700 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-[#14F195]"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="http://localhost:4242"
                    />
                    <button
                        onClick={handleLoad}
                        className="bg-[#14F195] text-black px-4 py-1.5 rounded font-bold hover:bg-[#10c478] transition"
                    >
                        Load
                    </button>
                </div>
            </header>

            <main className="flex-1 flex items-center justify-center p-8">
                <div className="w-[375px] h-[812px] bg-black border-[8px] border-gray-800 rounded-[40px] overflow-hidden flex flex-col shadow-2xl relative">

                    {/* iOS Notch Mock */}
                    <div className="absolute top-0 inset-x-0 h-6 bg-black z-50 flex justify-center">
                        <div className="w-40 h-6 bg-gray-800 rounded-b-3xl"></div>
                    </div>

                    <div className="flex-1 pt-6 pb-2">
                        {!manifest && !loading && !error && (
                            <div className="h-full flex flex-col items-center justify-center text-gray-500 p-8 text-center">
                                <p className="mb-4">Enter your local zero-xnft dev server URL to preview your layout.</p>
                                <code className="bg-gray-900 p-2 rounded text-xs text-[#14F195]">npx zero-xnft preview</code>
                            </div>
                        )}

                        {loading && (
                            <div className="h-full flex items-center justify-center">
                                <div className="animate-spin w-8 h-8 border-4 border-[#9945FF] border-t-transparent rounded-full"></div>
                            </div>
                        )}

                        {error && (
                            <div className="h-full flex flex-col items-center justify-center text-red-500 p-8 text-center bg-[#1A0A0A]">
                                <p className="font-bold mb-2">Connection Error</p>
                                <p className="text-sm">{error}</p>
                            </div>
                        )}

                        {manifest && (
                            <LayoutRendererWeb node={manifest.layouts[manifest.entryLayout]} />
                        )}
                    </div>

                    {/* Home indicator */}
                    <div className="h-1.5 w-32 bg-gray-600 rounded-full mx-auto my-2 absolute bottom-2 left-[50%] -translate-x-1/2"></div>
                </div>
            </main>
        </div>
    );
};

export default XNFTDevPreview;
