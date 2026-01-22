import { NextRequest, NextResponse } from 'next/server';
import { fetchArbitrageData } from '@/lib/sportsbookApi';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') || 'ARBITRAGE';

    const data = await fetchArbitrageData(type);

    return NextResponse.json({
      success: true,
      type: type,
      data: data
    });
  } catch (error) {
    console.error('Error fetching arbitrage data:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch arbitrage data',
        data: null 
      },
      { status: 500 }
    );
  }
}

