/**
 * POST /api/agent/jobs/[id]/resume
 * 恢复失败的 Agent 任务
 */
import { NextRequest, NextResponse } from 'next/server';
import { resumeAgentJob } from '@/lib/agent-api-client';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jobId = params.id;

    const result = await resumeAgentJob(jobId);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[Agent API] Resume job failed:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to resume job' },
      { status: 500 }
    );
  }
}
