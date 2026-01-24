import { NextRequest, NextResponse } from 'next/server';
import { getSportLeagues, transformToMatch } from '@/lib/sportsbookApi';

const BACKEND_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

export async function GET(
  request: NextRequest,
  { params }: { params: { sportKey: string } }
) {
  try {
    const { sportKey } = params;
    const searchParams = request.nextUrl.searchParams;
    const league = searchParams.get('league');
    const eventId = searchParams.get('eventId');
    const region = searchParams.get('region') || 'eu';
    const markets = searchParams.get('markets') || 'h2h';

    // Map high-level sport key (e.g. "football") to underlying Odds API leagues.
    const sportLeagues = getSportLeagues(sportKey);

    // If a specific league is requested, only fetch that one
    const leaguesToFetch =
      league && league !== 'all'
        ? [league]
        : sportLeagues;

    const paramsOdds = new URLSearchParams({
      regions: region,
      markets,
      oddsFormat: 'decimal',
    });

    if (eventId) {
      paramsOdds.set('eventIds', eventId);
    }

    // Fetch odds data from backend (The Odds API via Node server)
    const oddsArrays = await Promise.all(
      leaguesToFetch.map(async (leagueKey) => {
        try {
          const res = await fetch(
            `${BACKEND_BASE_URL}/api/betting/odds/${encodeURIComponent(
              leagueKey,
            )}?${paramsOdds.toString()}`,
            { cache: 'no-store' },
          );
          if (!res.ok) {
            return [];
          }
          const data = await res.json();
          return Array.isArray(data) ? data : [];
        } catch (e) {
          console.error('Error fetching odds from backend for', leagueKey, e);
          return [];
        }
      }),
    );

    const merged = oddsArrays.flat();

    // Transform to our Match format
    const allMatches = merged.map((event) => transformToMatch(event as any));

    const matches = eventId
      ? allMatches.filter((m) => m.id === eventId)
      : allMatches;

    return NextResponse.json({
      success: true,
      sport: sportKey,
      count: matches.length,
      matches,
    });
  } catch (error) {
    console.error('Error in sports API route:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch sports data',
        matches: [],
      },
      { status: 200 },
    );
  }
}

