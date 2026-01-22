import { NextResponse } from 'next/server';
import { fetchAvailableSports } from '@/lib/sportsbookApi';

export async function GET() {
  try {
    const sports = await fetchAvailableSports();

    return NextResponse.json({
      success: true,
      count: sports.length,
      sports: sports
    });
  } catch (error) {
    console.error('Error fetching available sports:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch sports',
        sports: [] 
      },
      { status: 500 }
    );
  }
}

