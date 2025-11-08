/**
 * GET /api/agent/jobs/[id]
 * DELETE /api/agent/jobs/[id]
 * POST /api/agent/jobs/[id]/retry
 * Phase 4: Agent 任务操作
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAgentJob, deleteAgentJob, retryAgentJob } from '@/lib/agent-api-client';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jobId = params.id;
    const includeShots = request.nextUrl.searchParams.get('include_shots') === 'true';

    const job = await getAgentJob(jobId, includeShots);

    return NextResponse.json(job);
  } catch (error: any) {
    console.error('[Agent API] Get job failed:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch job' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/agent/jobs/[id]
 * 删除 Agent 任务 (Phase 4)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jobId = params.id;

    await deleteAgentJob(jobId);

    return NextResponse.json({ success: true, message: 'Job deleted' });
  } catch (error: any) {
    console.error('[Agent API] Delete job failed:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete job' },
      { status: 500 }
    );
  }
}
