import { NextResponse } from 'next/server';
import { getFilteredSports } from '@/lib/sportsbookApi';

export async function GET() {
  try {
    const { all, byCategory } = await getFilteredSports();

    return NextResponse.json({
      success: true,
      count: all.length,
      sports: all,
      byCategory,
    });
  } catch (error) {
    console.error('Error fetching available sports:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch sports',
        sports: [],
        byCategory: {},
      },
      // Return 200 with success=false so the frontend
      // doesn't see this as a hard network error (500).
      { status: 200 }
    );
  }
}

