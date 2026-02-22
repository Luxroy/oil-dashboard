import { useEffect, useState } from 'react';
import { fetchProcessedOilData, fetchHistoricalData } from './utils/data-fetcher';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Droplet, Info, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { SpeedInsights } from '@vercel/speed-insights/react';

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

function App() {
    const [data, setData] = useState([]);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            try {
                const oilData = await fetchProcessedOilData();
                setData(oilData);

                const top5 = oilData.slice(0, 5);
                const historyData = await fetchHistoricalData(top5);
                setHistory(historyData);
            } catch (e) {
                console.error("Failed to load data", e);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-oil-black">
                <div className="flex flex-col items-center space-y-4">
                    <Droplet className="w-12 h-12 text-oil-gold animate-bounce" />
                    <p className="text-oil-gold font-mono tracking-widest uppercase">Pumping Data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-oil-black pb-20">
            <header className="border-b border-oil-gold border-opacity-20 sticky top-0 bg-oil-black z-10 backdrop-blur-md bg-opacity-90">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <Droplet className="w-8 h-8 text-oil-gold" />
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-oil-gold-light to-oil-gold bg-clip-text text-transparent uppercase tracking-wider">
                            Oil
                        </h1>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
                <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    {/* Metric Cards */}
                    {(() => {
                        const topProducer = data[0];
                        const biggestReserves = [...data].sort((a, b) => b.reserves - a.reserves)[0];
                        const lowestPrice = [...data].sort((a, b) => a.sellingPrice - b.sellingPrice)[0];
                        const marketShaper = [...data].sort((a, b) => b.correlationScore - a.correlationScore)[0];

                        return (
                            <>
                                <div className="p-6 rounded-2xl bg-gradient-to-br from-oil-light-gray to-oil-gray border border-oil-light-gray relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <TrendingUp className="w-24 h-24 text-oil-white" />
                                    </div>
                                    <p className="text-sm text-gray-400 font-medium tracking-wide uppercase">Top Producer</p>
                                    <p className="text-3xl font-bold text-oil-white mt-1">{topProducer?.country}</p>
                                    <p className="text-oil-gold text-sm mt-2">{topProducer?.production.toLocaleString()} bbl/day</p>
                                </div>

                                <div className="p-6 rounded-2xl bg-gradient-to-br from-oil-light-gray to-oil-gray border border-oil-light-gray relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <Droplet className="w-24 h-24 text-oil-white" />
                                    </div>
                                    <p className="text-sm text-gray-400 font-medium tracking-wide uppercase">Biggest Reserves</p>
                                    <p className="text-3xl font-bold text-oil-white mt-1">{biggestReserves?.country}</p>
                                    <p className="text-oil-gold text-sm mt-2">{biggestReserves?.reserves.toFixed(1)} Billion bbl</p>
                                </div>

                                <div className="p-6 rounded-2xl bg-gradient-to-br from-oil-light-gray to-oil-gray border border-oil-light-gray relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <TrendingDown className="w-24 h-24 text-oil-white" />
                                    </div>
                                    <p className="text-sm text-gray-400 font-medium tracking-wide uppercase">Lowest Price</p>
                                    <p className="text-3xl font-bold text-oil-white mt-1">{lowestPrice?.country}</p>
                                    <p className="text-oil-gold text-sm mt-2">${lowestPrice?.sellingPrice.toFixed(2)} ({lowestPrice?.benchmark})</p>
                                </div>

                                <div className="p-6 rounded-2xl bg-gradient-to-br from-oil-light-gray to-oil-gray border border-oil-light-gray relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <DollarSign className="w-24 h-24 text-oil-white" />
                                    </div>
                                    <p className="text-sm text-gray-400 font-medium tracking-wide uppercase">Market Shaper</p>
                                    <p className="text-3xl font-bold text-oil-white mt-1">{marketShaper?.country}</p>
                                    <p className="text-oil-gold text-sm mt-2">Score: {marketShaper?.correlationScore} / 10</p>
                                </div>
                            </>
                        )
                    })()}
                </section>

                <section>
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 space-y-4 md:space-y-0">
                        <h2 className="text-xl font-bold text-oil-white uppercase tracking-wider">Strategic Reserves & Flow</h2>
                        <span className="text-xs text-oil-green px-3 py-1 bg-oil-green/10 rounded-full border border-oil-green/20 whitespace-nowrap">
                            Green: High Prod, Low Price
                        </span>
                    </div>

                    <div className="mb-6 space-y-3">
                        <div className="p-4 bg-oil-black border border-oil-gold/20 rounded-xl flex items-start space-x-3 shadow-lg">
                            <Info className="w-5 h-5 text-oil-gold flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-gray-400 leading-relaxed">
                                <span className="text-oil-white font-semibold flex items-center gap-2">Correlation Score (0-10 Scale): </span>
                                A normalized metric gauging pricing power and geopolitical influence.
                                Calculated as a weighted blend of current production (40%) and proven reserves (60%) measured against the absolute global maximums (10 = highest influence, 0 = lowest).
                                Scores over 5.0 reflect major "Market Shapers", while scores under 2.0 reflect "Price Takers".
                            </div>
                        </div>
                        <div className="p-4 bg-oil-black border border-oil-light-gray rounded-xl flex items-start space-x-3 shadow-sm">
                            <Info className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-gray-400 leading-relaxed">
                                <span className="text-oil-white font-semibold">Benchmarks & Differentials: </span>
                                While baseline prices are set by regional Benchmarks (WTI, Brent, Dubai/Oman), actual selling prices feature a custom **Differential (Spread)**. This is a premium (+) or discount (-) applied based on the crude's specific quality (e.g., Heavy Sour vs. Light Sweet) and its transportation logistics.
                            </div>
                        </div>
                    </div>

                    <div className="bg-oil-gray rounded-2xl border border-oil-light-gray overflow-hidden shadow-2xl">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-oil-light-gray bg-opacity-50">
                                    <tr>
                                        <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-oil-gold uppercase tracking-wider border-b border-oil-light-gray">Country</th>
                                        <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-oil-gold uppercase tracking-wider border-b border-oil-light-gray">Production (bbl/day)</th>
                                        <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-oil-gold uppercase tracking-wider border-b border-oil-light-gray">Reserves (Billion bbl)</th>
                                        <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-oil-gold uppercase tracking-wider border-b border-oil-light-gray">Benchmark</th>
                                        <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-oil-gold uppercase tracking-wider border-b border-oil-light-gray">Selling Price & Spread</th>
                                        <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-oil-gold uppercase tracking-wider border-b border-oil-light-gray">Correlation Score (0-10)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-oil-light-gray">
                                    {data.map((row) => {
                                        const isHighProd = row.production >= 4000000;
                                        const isLowPrice = row.sellingPrice < 80;
                                        const isHighlighted = isHighProd && isLowPrice;

                                        return (
                                            <tr
                                                key={row.country}
                                                className={cn(
                                                    "transition-colors duration-200",
                                                    isHighlighted ? 'bg-oil-green/10' : 'bg-oil-gray hover:bg-oil-light-gray'
                                                )}
                                            >
                                                <td className={cn("px-4 py-4 whitespace-nowrap text-sm border-b border-oil-light-gray font-medium", isHighlighted ? "text-oil-green" : "text-oil-white")}>
                                                    {row.country}
                                                </td>
                                                <td className={cn("px-4 py-4 whitespace-nowrap text-sm border-b border-oil-light-gray font-mono", isHighlighted ? "text-oil-green" : "text-oil-white")}>
                                                    {row.production.toLocaleString()}
                                                </td>
                                                <td className={cn("px-4 py-4 whitespace-nowrap text-sm border-b border-oil-light-gray font-mono", isHighlighted ? "text-oil-green" : "text-gray-300")}>
                                                    {row.reserves.toFixed(1)}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm border-b border-oil-light-gray">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-oil-black text-oil-gold border border-oil-gold border-opacity-20">
                                                        {row.benchmark}
                                                    </span>
                                                </td>
                                                <td className={cn("px-4 py-4 whitespace-nowrap text-sm border-b border-oil-light-gray font-mono font-medium", isHighlighted ? "text-oil-green" : "text-oil-white")}>
                                                    <div className="text-base">${row.sellingPrice.toFixed(2)}</div>
                                                    <div className={cn("text-xs mt-0.5", isHighlighted ? "text-oil-green/70" : "text-gray-500")}>
                                                        ({row.benchmark} {row.differential > 0 ? '+' : ''}{row.differential === 0 ? 'Base' : `$${row.differential.toFixed(2)}`})
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm border-b border-oil-light-gray font-mono tracking-widest">
                                                    <span className={cn(
                                                        "px-2 py-1 rounded inline-block min-w-[3rem] text-center",
                                                        row.correlationScore >= 8 ? "bg-red-500/10 text-red-500" :
                                                            row.correlationScore <= 2 ? "bg-blue-500/10 text-blue-400" :
                                                                "bg-oil-gold/10 text-oil-gold"
                                                    )}>
                                                        {row.correlationScore}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>

                <section>
                    <div className="mb-6">
                        <h2 className="text-xl font-bold text-oil-white uppercase tracking-wider">Historical Spot Benchmarks</h2>
                        <p className="text-sm text-gray-400 mt-1">Real-time trailing 12-month EIA API data for primary global crudes</p>
                    </div>
                    <div className="bg-oil-gray rounded-2xl border border-oil-light-gray p-6 shadow-2xl h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={history} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
                                <XAxis dataKey="name" stroke="#666" tick={{ fill: '#888' }} axisLine={false} tickLine={false} />
                                <YAxis stroke="#666" tick={{ fill: '#888' }} axisLine={false} tickLine={false} tickFormatter={(val) => `$${val}`} domain={['auto', 'auto']} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '8px', color: '#fff' }}
                                    itemStyle={{ color: '#d4af37' }}
                                />
                                <Legend wrapperStyle={{ paddingTop: '20px' }} />

                                <Line
                                    type="monotone"
                                    dataKey="Brent Crude"
                                    stroke="#d4af37"
                                    strokeWidth={3}
                                    dot={{ r: 4, fill: '#0a0a0a', stroke: '#d4af37', strokeWidth: 2 }}
                                    activeDot={{ r: 6 }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="WTI Crude"
                                    stroke="#ffffff"
                                    strokeWidth={3}
                                    dot={{ r: 4, fill: '#0a0a0a', stroke: '#ffffff', strokeWidth: 2 }}
                                    activeDot={{ r: 6 }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="Dubai/Oman (Est.)"
                                    stroke="#22c55e"
                                    strokeWidth={2}
                                    strokeDasharray="5 5"
                                    dot={{ r: 3, fill: '#0a0a0a', stroke: '#22c55e', strokeWidth: 2 }}
                                    activeDot={{ r: 5 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </section>

            </main>
            <SpeedInsights />
        </div>
    );
}

export default App;
