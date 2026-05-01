/**
 * Transforms raw SportMonks v3 odds into the frontend's MatchMarket array format.
 * 
 * Target Output Array of MatchMarket:
 * [
 *   {
 *     key: 'h2h',
 *     outcomes: [
 *       { name: 'Home', price: 2.10 },
 *       { name: 'Draw', price: 3.40 },
 *       { name: 'Away', price: 3.25 }
 *     ]
 *   },
 *   ...
 * ]
 */

export function transformSportMonksOdds(rawOddsArray, homeTeamName, awayTeamName) {
    if (!rawOddsArray || !Array.isArray(rawOddsArray)) return [];

    // SportMonks odds structure depending on includes:
    // Array of Markets -> each has 'bookmakers' -> each has 'odds'
    // We'll aggregate them into a unified format, prioritizing a main bookie if possible,
    // or just taking the first available bookmaker for each market.

    const marketsMap = new Map();

    // Mapping SportMonks Market IDs/Names to our internal keys
    // Note: These IDs or names need to be adapted based on actual SportMonks Market Names
    const marketTypeMap = {
        '1x2': 'h2h',
        '3Way Result': 'h2h',
        'Match Winner': 'h2h',
        'Over/Under': 'totals',
        'Both Teams To Score': 'btts',
        'Double Chance': 'double_chance',
        'Draw No Bet': 'draw_no_bet',
    };

    rawOddsArray.forEach(marketItem => {
        // Determine internal market key
        const smMarketName = marketItem.name || marketItem.market?.name;
        if (!smMarketName) return;

        const internalKey = marketTypeMap[smMarketName] || smMarketName.toLowerCase().replace(/[^a-z0-9]/g, '_');

        // Getting the bookmakers for this market
        const bookmakers = marketItem.bookmakers || [];
        if (bookmakers.length === 0) return;

        // Pick the first bookmaker (or you could prioritize 'bet365', etc.)
        const primaryBookmaker = bookmakers[0];
        const rawOutcomes = primaryBookmaker.odds || [];

        const transformedOutcomes = rawOutcomes.map(odd => {
            // Sportmonks label might be '1', '2', 'X', 'Over', 'Under', 'Yes', 'No'
            let name = odd.label || odd.name;

            // Standardize 1x2 labels to team names
            if (internalKey === 'h2h') {
                if (name === '1' || name?.toLowerCase() === 'home') name = homeTeamName || 'Home';
                if (name === '2' || name?.toLowerCase() === 'away') name = awayTeamName || 'Away';
                if (name === 'X' || name?.toLowerCase() === 'draw') name = 'Draw';
            }

            // Format over/under
            if (internalKey === 'totals') {
                if (name === 'Over') name = 'Over';
                if (name === 'Under') name = 'Under';
                // Some bookmakers encode the line in the name itself, e.g., "Over 2.5"
            }

            const outcome = {
                name,
                price: parseFloat(odd.value) || 0,
            };

            // Extract line/point if available (like Over 2.5)
            if (odd.total) outcome.line = parseFloat(odd.total);
            if (odd.handicap) outcome.line = parseFloat(odd.handicap);

            return outcome;
        });

        if (transformedOutcomes.length > 0) {
            // If we already added this market, skip (or merge)
            if (!marketsMap.has(internalKey)) {
                marketsMap.set(internalKey, {
                    key: internalKey,
                    outcomes: transformedOutcomes,
                    last_update: primaryBookmaker.last_update || new Date().toISOString()
                });
            }
        }
    });

    return Array.from(marketsMap.values());
}
