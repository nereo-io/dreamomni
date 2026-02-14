/**
 * POST /api/agent/jobs/[id]/retry
 * 重试失败的 Agent 任务 (Phase 4)
 */
import { NextRequest, NextResponse } from 'next/server';
import { retryAgentJob } from '@/lib/agent-api-client';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jobId = params.id;

    const result = await retryAgentJob(jobId);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[Agent API] Retry job failed:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to retry job' },
      { status: 500 }
    );
  }
}
