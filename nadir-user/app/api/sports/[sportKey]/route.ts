import { NextRequest, NextResponse } from 'next/server';
import { fetchOddsForMultipleSports, getSportLeagues, transformToMatch } from '@/lib/sportsbookApi';

export async function GET(
  request: NextRequest,
  { params }: { params: { sportKey: string } }
) {
  try {
    const { sportKey } = params;
    const searchParams = request.nextUrl.searchParams;
    const league = searchParams.get('league');
    const region = searchParams.get('region') || 'us';
    const markets = searchParams.get('markets') || 'h2h,spreads,totals';

    // Get leagues for this sport
    const sportLeagues = getSportLeagues(sportKey);
    
    // If a specific league is requested, only fetch that one
    const leaguesToFetch = league && league !== 'all' 
      ? [league] 
      : sportLeagues;

    // Fetch odds data
    const oddsData = await fetchOddsForMultipleSports(leaguesToFetch, region, markets);
    
    // Transform to our Match format
    const matches = oddsData.map(transformToMatch);

    return NextResponse.json({
      success: true,
      sport: sportKey,
      count: matches.length,
      matches: matches
    });
  } catch (error: any) {
    console.error('Error in sports API route:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to fetch sports data',
        matches: [] 
      },
      { status: 500 }
    );
  }
}

