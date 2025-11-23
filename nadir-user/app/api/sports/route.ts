import { NextRequest, NextResponse } from 'next/server';
import { fetchAvailableSports } from '@/lib/sportsbookApi';

export async function GET(request: NextRequest) {
  try {
    const sports = await fetchAvailableSports();

    return NextResponse.json({
      success: true,
      count: sports.length,
      sports: sports
    });
  } catch (error: any) {
    console.error('Error fetching available sports:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to fetch sports',
        sports: [] 
      },
      { status: 500 }
    );
  }
}

