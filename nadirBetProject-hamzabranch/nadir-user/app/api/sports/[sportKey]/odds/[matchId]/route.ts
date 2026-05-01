import { NextRequest, NextResponse } from 'next/server';

const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

export async function GET(
  request: NextRequest,
  { params }: { params: { sportKey: string; matchId: string } }
) {
  try {
    const { sportKey, matchId } = params;

    const url = `${BACKEND_BASE_URL}/api/sports/${sportKey.toLowerCase()}/odds/${encodeURIComponent(matchId)}`;
    const res = await fetch(url, { cache: 'no-store' });

    if (!res.ok) {
      return NextResponse.json({ success: true, markets: [] });
    }

    const json = await res.json();
    return NextResponse.json(json);
  } catch (error) {
    console.error('[Odds Proxy] Error:', error);
    return NextResponse.json({ success: false, markets: [] });
  }
}
