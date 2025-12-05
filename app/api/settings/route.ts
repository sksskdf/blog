import { getSettings, updateSettings } from '../../../lib/settings';
import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse, Settings } from '@/types';


export const revalidate = 300;

export async function GET(): Promise<NextResponse<Settings | ApiResponse>> {
  try {
    const settings = await getSettings();
    const response = NextResponse.json(settings);

    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    return response;
  } catch (error) {
    console.error('Error getting settings:', error);
    return NextResponse.json({ error: 'Failed to get settings' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest): Promise<NextResponse<Settings | ApiResponse>> {
  try {
    const body = await request.json();
    const { name, siteTitle, subtitle, description } = body;
    const updatedSettings = await updateSettings({ name, siteTitle, subtitle, description });
    return NextResponse.json(updatedSettings);
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}

