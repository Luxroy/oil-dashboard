// data-fetcher.js

export const MOckSpotPrices = {
    WTI: 66.39,
    Brent: 71.68,
    DubaiOman: 72.10, // Proxied alongside Brent averages typically
};

// Fallback/Base data for regions and static reserves (if EIA API doesn't easily expose reserves on the international endpoint)
export const BaseCountryMap = {
    "United States": { reserves: 44.4, region: "West", differential: 0.00 }, // WTI baseline
    "Saudi Arabia": { reserves: 267.1, region: "Middle East", differential: 1.50 }, // Arab Light premium
    "Russia": { reserves: 80.0, region: "Europe/Africa", differential: -12.00 }, // Urals discount
    "Canada": { reserves: 168.1, region: "West", differential: -15.00 }, // WCS heavy discount
    "Iraq": { reserves: 145.0, region: "Middle East", differential: -2.00 }, // Basrah Heavy discount
    "China": { reserves: 26.0, region: "West", differential: -1.00 },
    "United Arab Emirates": { reserves: 111.0, region: "Middle East", differential: 0.50 }, // Murban premium
    "Iran": { reserves: 208.6, region: "Middle East", differential: -1.50 }, // Iran Heavy discount
    "Brazil": { reserves: 13.2, region: "West", differential: 0.50 }, // Lula premium
    "Kuwait": { reserves: 101.5, region: "Middle East", differential: -1.00 }, // Kuwait Export discount
    "Norway": { reserves: 5.1, region: "Europe/Africa", differential: 1.00 }, // Oseberg premium
    "Nigeria": { reserves: 36.9, region: "Europe/Africa", differential: 2.50 }, // Bonny Light premium
    "Mexico": { reserves: 5.8, region: "West", differential: -8.00 }, // Maya heavy discount
    "Kazakhstan": { reserves: 30.0, region: "Europe/Africa", differential: -1.50 }, // CPC blend
    "Qatar": { reserves: 25.2, region: "Middle East", differential: 1.00 }, // Qatar Marine
    "Algeria": { reserves: 12.2, region: "Europe/Africa", differential: 3.00 }, // Saharan Blend premium
    "Oman": { reserves: 5.4, region: "Middle East", differential: 0.00 }, // Dubai/Oman baseline
    "United Kingdom": { reserves: 2.5, region: "Europe/Africa", differential: 0.00 }, // Brent baseline
    "Colombia": { reserves: 2.0, region: "West", differential: -7.00 }, // Castilla heavy discount
    "Angola": { reserves: 7.8, region: "Europe/Africa", differential: -1.00 }, // Cabinda
    "Libya": { reserves: 48.4, region: "Europe/Africa", differential: 2.00 }, // Es Sider premium
    "Argentina": { reserves: 2.5, region: "West", differential: 0.00 }, // Escalante
    "Indonesia": { reserves: 2.4, region: "Middle East", differential: 1.00 }, // Minas premium
    "Azerbaijan": { reserves: 7.0, region: "Europe/Africa", differential: 1.50 }, // Azeri Light premium
    "Egypt": { reserves: 3.3, region: "Middle East", differential: -2.00 }, // Belayim discount
};

export const getPriceData = (region, differential, spotPrices = MOckSpotPrices) => {
    let benchmarkName = "";
    let basePrice = 0;

    switch (region) {
        case "Middle East":
            benchmarkName = "Dubai/Oman";
            basePrice = spotPrices.DubaiOman;
            break;
        case "West":
            benchmarkName = "WTI";
            basePrice = spotPrices.WTI;
            break;
        case "Europe/Africa":
        default:
            benchmarkName = "Brent";
            basePrice = spotPrices.Brent;
            break;
    }

    return {
        benchmark: benchmarkName,
        basePrice: basePrice,
        differential: differential,
        sellingPrice: Math.max(0, basePrice + differential)
    };
};

// Cache configuration: 15 minutes TTL
const CACHE_TTL_MS = 15 * 60 * 1000;

export const getCachedData = (key) => {
    try {
        const cached = localStorage.getItem(key);
        if (!cached) return null;

        const parsed = JSON.parse(cached);
        // Check if cache expired
        if (Date.now() - parsed.timestamp > CACHE_TTL_MS) {
            localStorage.removeItem(key);
            return null;
        }
        return parsed.data;
    } catch (e) {
        console.warn("Failed to read cache", e);
        return null;
    }
};

export const setCachedData = (key, data) => {
    try {
        const payload = {
            timestamp: Date.now(),
            data: data
        };
        localStorage.setItem(key, JSON.stringify(payload));
    } catch (e) {
        console.warn("Failed to write to cache", e);
    }
};

export const fetchLivePrices = async (apiKey) => {
    if (!apiKey) return MOckSpotPrices;

    const CACHE_KEY = "oil_live_prices";
    const cachedPrices = getCachedData(CACHE_KEY);
    if (cachedPrices) {
        console.log("Using cached live prices");
        return cachedPrices;
    }

    try {
        const url = `https://api.eia.gov/v2/petroleum/pri/spt/data?api_key=${apiKey}&frequency=daily&data[0]=value&facets[series][]=RBRTE&facets[series][]=RWTC&sort[0][column]=period&sort[0][direction]=desc&offset=0&length=10`;
        const res = await fetch(url);
        const data = await res.json();
        const rawData = data.response?.data || [];

        let brentPrice = null;
        let wtiPrice = null;

        rawData.forEach(item => {
            if (item.series === "RBRTE" && brentPrice === null) brentPrice = parseFloat(item.value);
            if (item.series === "RWTC" && wtiPrice === null) wtiPrice = parseFloat(item.value);
        });

        if (brentPrice !== null && wtiPrice !== null) {
            const finalPrices = {
                WTI: wtiPrice,
                Brent: brentPrice,
                DubaiOman: parseFloat((brentPrice + 0.42).toFixed(2)) // Proxied closely to Brent
            };
            setCachedData(CACHE_KEY, finalPrices);
            return finalPrices;
        }
    } catch (e) {
        console.error("Error fetching live EIA prices:", e);
    }
    return MOckSpotPrices;
};

export const calculateCorrelationScore = (production, reserves, maxProd, maxReserves) => {
    if (maxProd === 0 || maxReserves === 0) return 0;
    const score = ((production / maxProd) * 0.4) + ((reserves / maxReserves) * 0.6);
    return Math.min(Math.max(score * 10, 0), 10).toFixed(2);
};

export const fetchProcessedOilData = async () => {
    const apiKey = import.meta.env.VITE_EIA_KEY;
    let finalData = [];
    let currentSpotPrices = { ...MOckSpotPrices };

    if (apiKey && apiKey.trim() !== "") {
        const CACHE_KEY = "oil_processed_data";
        const cachedProcessed = getCachedData(CACHE_KEY);

        currentSpotPrices = await fetchLivePrices(apiKey);

        if (cachedProcessed) {
            console.log("Using cached processed global data");
            finalData = cachedProcessed;
        } else {
            try {
                // Query EIA API v2 for International Petroleum Production
                // activityId: 1 (Production), productId: 53 (Crude oil including lease condensate)
                const url = `https://api.eia.gov/v2/international/data?api_key=${apiKey}&frequency=annual&data[0]=value&facets[activityId][]=1&facets[productId][]=53&sort[0][column]=period&sort[0][direction]=desc&offset=0&length=500`;

                const res = await fetch(url);
                const eiaData = await res.json();

                // The data array contains entries for different countries over time.
                // We want the most recent year's data for our recognized base countries.
                const rawData = eiaData.response?.data || [];

                const countryLatestProd = {};
                rawData.forEach(item => {
                    const cName = item.countryRegionName;
                    // EIA gives data in thousand barrels per day. We need actual bbl/day.
                    if (BaseCountryMap[cName]) {
                        // If we haven't seen this country yet (since it's sorted desc by period), this is the latest.
                        if (!countryLatestProd[cName]) {
                            countryLatestProd[cName] = item.value * 1000;
                        }
                    }
                });

                // Build out the final mapped dataset using the fetched EIA production.
                finalData = Object.entries(BaseCountryMap).map(([country, baseInfo]) => {
                    return {
                        country,
                        production: countryLatestProd[country] || 0, // from EIA API
                        reserves: baseInfo.reserves, // from base data since reserves API requires separate complex query
                        region: baseInfo.region,
                        differential: baseInfo.differential
                    };
                });

                // Cache the final production mapping
                setCachedData(CACHE_KEY, finalData);

            } catch (e) {
                console.error("Error fetching EIA API:", e);
                // Fallback
            }
        }
    }

    // If API fetch failed or no key, fallback to mock data shape
    if (finalData.length === 0) {
        console.log("Using local combined data mock");
        finalData = [
            { country: "United States", production: 13200000, reserves: 44.4, region: "West" },
            { country: "Saudi Arabia", production: 9000000, reserves: 267.1, region: "Middle East" },
            { country: "Russia", production: 9500000, reserves: 80.0, region: "Europe/Africa" },
            { country: "Canada", production: 4900000, reserves: 168.1, region: "West" },
            { country: "Iraq", production: 4300000, reserves: 145.0, region: "Middle East" },
            { country: "China", production: 4100000, reserves: 26.0, region: "West" },
            { country: "United Arab Emirates", production: 3200000, reserves: 111.0, region: "Middle East" },
            { country: "Iran", production: 3000000, reserves: 208.6, region: "Middle East" },
            { country: "Brazil", production: 3400000, reserves: 13.2, region: "West" },
            { country: "Kuwait", production: 2500000, reserves: 101.5, region: "Middle East" },
            { country: "Norway", production: 2000000, reserves: 5.1, region: "Europe/Africa" },
            { country: "Nigeria", production: 1300000, reserves: 36.9, region: "Europe/Africa" },
            { country: "Mexico", production: 1700000, reserves: 5.8, region: "West" },
            { country: "Kazakhstan", production: 1800000, reserves: 30.0, region: "Europe/Africa" },
            { country: "Qatar", production: 1500000, reserves: 25.2, region: "Middle East" },
            { country: "Algeria", production: 1200000, reserves: 12.2, region: "Europe/Africa" },
            { country: "Oman", production: 1000000, reserves: 5.4, region: "Middle East" },
            { country: "United Kingdom", production: 900000, reserves: 2.5, region: "Europe/Africa" },
            { country: "Colombia", production: 750000, reserves: 2.0, region: "West" },
            { country: "Angola", production: 1100000, reserves: 7.8, region: "Europe/Africa" },
            { country: "Libya", production: 1200000, reserves: 48.4, region: "Europe/Africa" },
            { country: "Argentina", production: 600000, reserves: 2.5, region: "West" },
            { country: "Indonesia", production: 700000, reserves: 2.4, region: "Middle East" },
            { country: "Azerbaijan", production: 650000, reserves: 7.0, region: "Europe/Africa" },
            { country: "Egypt", production: 600000, reserves: 3.3, region: "Middle East" },
        ];
    }

    const maxProd = Math.max(...finalData.map(d => d.production));
    const maxRes = Math.max(...finalData.map(d => d.reserves));

    return finalData.map(countryData => {
        // Fallback to BaseCountryMap to secure differential if not injected cleanly in earlier mock
        const differential = countryData.differential !== undefined ? countryData.differential : (BaseCountryMap[countryData.country]?.differential || 0);

        const priceInfo = getPriceData(countryData.region, differential, currentSpotPrices);
        const score = calculateCorrelationScore(countryData.production, countryData.reserves, maxProd, maxRes);

        return {
            ...countryData,
            benchmark: priceInfo.benchmark,
            basePrice: priceInfo.basePrice,
            differential: priceInfo.differential,
            sellingPrice: priceInfo.sellingPrice,
            correlationScore: parseFloat(score),
        };
    }).sort((a, b) => b.production - a.production);
};

export const fetchHistoricalData = async () => {
    const apiKey = import.meta.env.VITE_EIA_KEY;
    if (!apiKey) return []; // Require API key

    const CACHE_KEY = "oil_historical_data";
    const cachedHistory = getCachedData(CACHE_KEY);
    if (cachedHistory) {
        console.log("Using cached historical data");
        return cachedHistory;
    }

    try {
        // Fetch daily data for the past ~365 days (length=250 trading days roughly covers a year)
        const url = `https://api.eia.gov/v2/petroleum/pri/spt/data?api_key=${apiKey}&frequency=daily&data[0]=value&facets[series][]=RBRTE&facets[series][]=RWTC&sort[0][column]=period&sort[0][direction]=desc&offset=0&length=500`;
        const res = await fetch(url);
        const data = await res.json();
        const rawData = data.response?.data || [];

        // Group the daily data by Month (e.g., "2023-10") and calculate monthly averages
        const monthlyAverages = {};

        rawData.forEach(item => {
            const dateStr = item.period; // e.g., "2023-10-25"
            // Ensure the date is well-formed
            if (!dateStr || dateStr.length < 7) return;

            const monthKey = dateStr.substring(0, 7); // Get "YYYY-MM"

            if (!monthlyAverages[monthKey]) {
                monthlyAverages[monthKey] = { Brent: { sum: 0, count: 0 }, WTI: { sum: 0, count: 0 }, dateObj: new Date(monthKey + "-01") };
            }

            const val = parseFloat(item.value);
            if (!isNaN(val)) {
                if (item.series === "RBRTE") {
                    monthlyAverages[monthKey].Brent.sum += val;
                    monthlyAverages[monthKey].Brent.count += 1;
                } else if (item.series === "RWTC") {
                    monthlyAverages[monthKey].WTI.sum += val;
                    monthlyAverages[monthKey].WTI.count += 1;
                }
            }
        });

        // Convert grouped object to array, sort chronologically, and take the last 12 months
        const sortedMonths = Object.keys(monthlyAverages)
            .sort((a, b) => monthlyAverages[a].dateObj - monthlyAverages[b].dateObj)
            .slice(-12);

        // Format for Recharts
        const chartData = sortedMonths.map(monthKey => {
            const entry = monthlyAverages[monthKey];
            const date = entry.dateObj;
            const monthName = date.toLocaleString('default', { month: 'short' }) + ' ' + date.getFullYear().toString().substring(2);

            const brentAvg = entry.Brent.count > 0 ? (entry.Brent.sum / entry.Brent.count) : null;
            const wtiAvg = entry.WTI.count > 0 ? (entry.WTI.sum / entry.WTI.count) : null;

            return {
                name: monthName,
                "Brent Crude": brentAvg ? parseFloat(brentAvg.toFixed(2)) : null,
                "WTI Crude": wtiAvg ? parseFloat(wtiAvg.toFixed(2)) : null,
                "Dubai/Oman (Est.)": brentAvg ? parseFloat((brentAvg + 0.42).toFixed(2)) : null
            };
        });

        return chartData;

    } catch (e) {
        console.error("Error fetching historical EIA prices for chart:", e);
        return [];
    }
};
