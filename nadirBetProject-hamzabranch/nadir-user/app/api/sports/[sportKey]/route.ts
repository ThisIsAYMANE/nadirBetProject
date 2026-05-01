import { NextRequest, NextResponse } from 'next/server';
import { Match } from '@/types';

const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

// ─── Sport-specific data model parsers ─────────────────────────────────────

/**
 * Football: response items are fixtures with nested structure
 * { fixture: { id, date, status }, teams: { home, away }, league, goals }
 */
function parseFootballFixture(item: any): Partial<Match> {
  const id = item.fixture?.id?.toString() ?? Math.random().toString();
  const startTime = item.fixture?.date ?? new Date().toISOString();
  const statusShort = item.fixture?.status?.short ?? 'NS';
  const isLive = ['1H', '2H', 'HT', 'ET', 'P', 'BT', 'INT'].includes(statusShort);
  const isFinished = ['FT', 'AET', 'PEN'].includes(statusShort);

  return {
    id,
    homeTeam: item.teams?.home?.name ?? 'Home',
    awayTeam: item.teams?.away?.name ?? 'Away',
    homeTeamLogo: item.teams?.home?.logo,
    awayTeamLogo: item.teams?.away?.logo,
    league: item.league?.name ?? 'Football',
    startTime,
    status: isFinished ? 'finished' : isLive ? 'live' : 'upcoming',
    isLive,
    homeScore: item.goals?.home ?? undefined,
    awayScore: item.goals?.away ?? undefined,
  };
}

/**
 * Standard game model — used by AFL, Baseball, Basketball, Handball, Hockey,
 * NBA, NFL, Rugby, Volleyball
 * { id, date, status: { short }, teams: { home, away }, league, scores }
 */

/** Normalize any date value from any sport API into a valid ISO string */
function normalizeDate(raw: any): string {
  if (!raw) return new Date().toISOString();
  // Already a valid ISO/timestamp string
  const d = new Date(raw);
  if (!isNaN(d.getTime())) return d.toISOString();
  // NBA sometimes returns just "YYYY-MM-DD" which should work, or epoch numbers
  if (typeof raw === 'number') return new Date(raw * 1000).toISOString();
  // Fallback to today if completely unparseable
  return new Date().toISOString();
}

function parseStandardGame(item: any): Partial<Match> {
  const id = (item.id ?? item.game?.id ?? Math.random()).toString();
  const rawDate = item.date ?? item.game?.date ?? item.start ?? item.time?.date ?? item.timestamp;
  const startTime = normalizeDate(rawDate);
  const statusShort = item.status?.short ?? item.game?.status?.short ?? item.status?.long ?? 'NS';
  const isLive = ['LIVE', 'Q1', 'Q2', 'Q3', 'Q4', 'HT', 'OT', 'BT', 'P1', 'P2', 'P3', 'IN PROGRESS'].includes(statusShort);
  const isFinished = ['FT', 'AOT', 'Finished', 'Complete'].includes(statusShort);

  // Teams can be at top level or nested
  const homeTeam = item.teams?.home?.name ?? item.home?.name ?? 'Home';
  const awayTeam = item.teams?.away?.name ?? item.away?.name ?? 'Away';
  const homeTeamLogo = item.teams?.home?.logo ?? item.home?.logo;
  const awayTeamLogo = item.teams?.away?.logo ?? item.away?.logo;

  // Scores (NBA/NFL use different keys)
  const homeScore = item.scores?.home?.total ?? item.scores?.home ?? item.teams?.home?.score ?? undefined;
  const awayScore = item.scores?.away?.total ?? item.scores?.away ?? item.teams?.away?.score ?? undefined;

  return {
    id,
    homeTeam,
    awayTeam,
    homeTeamLogo,
    awayTeamLogo,
    league: item.league?.name ?? item.competition?.name ?? '',
    startTime,
    status: isFinished ? 'finished' : isLive ? 'live' : 'upcoming',
    isLive,
    homeScore: homeScore !== undefined ? Number(homeScore) : undefined,
    awayScore: awayScore !== undefined ? Number(awayScore) : undefined,
  };
}

/**
 * MMA: fights are between two fighters (not teams)
 * { id, date, status, fighters: { home, away } / fighter1, fighter2 }
 */
function parseMMAFight(item: any): Partial<Match> {
  const id = (item.id ?? Math.random()).toString();
  const startTime = item.date ?? new Date().toISOString();
  const statusShort = item.status?.short ?? 'NS';
  const isLive = statusShort === 'LIVE' || statusShort === 'IN PROGRESS';
  const isFinished = ['FT', 'Finished', 'Complete'].includes(statusShort);

  // Fighter names as home/away
  const homeTeam = item.fighters?.home?.name ?? item.fighter1?.name ?? 'Fighter 1';
  const awayTeam = item.fighters?.away?.name ?? item.fighter2?.name ?? 'Fighter 2';
  const homeTeamLogo = item.fighters?.home?.image ?? item.fighter1?.image;
  const awayTeamLogo = item.fighters?.away?.image ?? item.fighter2?.image;

  return {
    id,
    homeTeam,
    awayTeam,
    homeTeamLogo,
    awayTeamLogo,
    league: item.league?.name ?? item.event?.name ?? 'MMA',
    startTime,
    status: isFinished ? 'finished' : isLive ? 'live' : 'upcoming',
    isLive,
  };
}

/**
 * Formula-1: races, not matches
 * { id, competition: { name, location }, season, date, circuit, type }
 */
function parseF1Race(item: any): Partial<Match> {
  const id = (item.id ?? item.race?.id ?? Math.random()).toString();
  const startTime = item.date ?? new Date().toISOString();
  const statusShort = item.status ?? 'NS';
  const isLive = statusShort === 'Race In Progress' || statusShort === 'LIVE';
  const isFinished = statusShort === 'Race Over' || statusShort === 'Completed';

  const raceName = item.competition?.name ?? item.race?.competition?.name ?? 'Grand Prix';
  const circuitName = item.circuit?.name ?? '';
  const location = item.competition?.location?.city ?? item.competition?.location?.country ?? '';

  return {
    id,
    homeTeam: raceName,           // Race name as "home"
    awayTeam: location || circuitName, // Circuit/Location as "away"
    homeTeamLogo: item.competition?.image,
    awayTeamLogo: item.circuit?.image,
    league: `Formula 1 — Season ${item.season ?? ''}`,
    startTime,
    status: isFinished ? 'finished' : isLive ? 'live' : 'upcoming',
    isLive,
  };
}

// ─── Master parser ──────────────────────────────────────────────────────────

function parseItem(sport: string, item: any): Match {
  let partial: Partial<Match>;

  switch (sport.toLowerCase()) {
    case 'football':
      partial = parseFootballFixture(item);
      break;
    case 'mma':
      partial = parseMMAFight(item);
      break;
    case 'formula-1':
      partial = parseF1Race(item);
      break;
    default:
      // AFL, Baseball, Basketball, Handball, Hockey, NBA, NFL, Rugby, Volleyball
      partial = parseStandardGame(item);
      break;
  }

  // Stable deterministic odds based on match id (avoids re-renders from Math.random)
  const seed = parseInt(partial.id ?? '1', 36) || 1;
  const homeOdds = parseFloat((1.3 + (seed % 17) * 0.1).toFixed(2));
  const awayOdds = parseFloat((1.5 + (seed % 13) * 0.15).toFixed(2));
  const drawOdds = parseFloat((2.8 + (seed % 7) * 0.2).toFixed(2));

  // Only include draw odds for sports that actually have draws
  const sportsWithDraw = ['football', 'rugby', 'handball', 'hockey', 'volleyball'];
  const hasDraw = sportsWithDraw.includes(sport.toLowerCase());

  return {
    id: partial.id ?? Math.random().toString(),
    homeTeam: partial.homeTeam ?? 'Home',
    awayTeam: partial.awayTeam ?? 'Away',
    homeTeamLogo: partial.homeTeamLogo,
    awayTeamLogo: partial.awayTeamLogo,
    sport,
    league: partial.league ?? sport.toUpperCase(),
    startTime: partial.startTime ?? new Date().toISOString(),
    status: partial.status ?? 'upcoming',
    isLive: partial.isLive ?? false,
    homeScore: partial.homeScore,
    awayScore: partial.awayScore,
    odds: {
      home: homeOdds,
      draw: hasDraw ? drawOdds : undefined,
      away: awayOdds,
    },
    markets: [
      {
        key: 'h2h',
        outcomes: [
          { name: partial.homeTeam ?? 'Home', price: homeOdds },
          ...(hasDraw ? [{ name: 'Draw', price: drawOdds }] : []),
          { name: partial.awayTeam ?? 'Away', price: awayOdds },
        ],
      },
    ],
  };
}

// ─── Next.js API Route ──────────────────────────────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: { sportKey: string } }
) {
  try {
    const { sportKey } = params;
    const searchParams = request.nextUrl.searchParams;
    const dateParam = searchParams.get('date');
    const leagueParam = searchParams.get('league');
    const seasonParam = searchParams.get('season');
    const liveParam = searchParams.get('live');

    // Use the new /matches semantic endpoint on the backend
    const query = new URLSearchParams();
    if (dateParam) query.set('date', dateParam);
    else if (!liveParam) query.set('date', new Date().toISOString().split('T')[0]);
    if (leagueParam) query.set('league', leagueParam);
    if (seasonParam) query.set('season', seasonParam);
    if (liveParam) query.set('live', liveParam);

    const targetUrl = `${BACKEND_BASE_URL}/api/sports/${sportKey.toLowerCase()}/matches?${query.toString()}`;

    const res = await fetch(targetUrl, { cache: 'no-store' });

    if (!res.ok) {
      console.error(`[Sports Frontend] Backend returned ${res.status} for ${sportKey}`);
      return NextResponse.json({ success: true, sport: sportKey, count: 0, matches: [] });
    }

    const json = await res.json();

    // Backend wraps: { success, sport, data: { response: [...] } }
    const items: any[] = json?.data?.response ?? [];

    const matches = items.map((item) => parseItem(sportKey, item));

    return NextResponse.json({
      success: true,
      sport: sportKey,
      count: matches.length,
      matches,
    });
  } catch (error) {
    console.error(`[Sports Frontend] Error for ${params.sportKey}:`, error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch sports data',
        matches: [],
      },
      { status: 200 }
    );
  }
}
