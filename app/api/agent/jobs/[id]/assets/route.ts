/**
 * GET /api/agent/jobs/[id]/assets
 * 获取 Agent 任务的所有资产 (Phase 4)
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAgentJobAssets } from '@/lib/agent-api-client';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jobId = params.id;
    const assetType = request.nextUrl.searchParams.get('asset_type') || undefined;
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50');
    const offset = parseInt(request.nextUrl.searchParams.get('offset') || '0');

    const assets = await getAgentJobAssets(jobId, assetType, limit, offset);

    return NextResponse.json(assets);
  } catch (error: any) {
    console.error('[Agent API] Get assets failed:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch assets' },
      { status: 500 }
    );
  }
}
