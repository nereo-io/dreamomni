/**
 * GET /api/agent/jobs
 * 获取用户的 Agent 任务列表 (Phase 4)
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAgentJobs, createAgentJob } from '@/lib/agent-api-client';
import { auth } from '@/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.uuid) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const page = parseInt(request.nextUrl.searchParams.get('page') || '1');
    const pageSize = parseInt(request.nextUrl.searchParams.get('page_size') || '20');

    const jobs = await getAgentJobs(session.user.uuid, page, pageSize);

    return NextResponse.json(jobs);
  } catch (error: any) {
    console.error('[Agent API] Get jobs failed:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/agent/jobs
 * 创建新的 Agent 任务 (Phase 4)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.uuid) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // 添加 user_id
    const jobData = {
      ...body,
      user_id: session.user.uuid,
    };

    const job = await createAgentJob(jobData);

    return NextResponse.json(job, { status: 201 });
  } catch (error: any) {
    console.error('[Agent API] Create job failed:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create job' },
      { status: 500 }
    );
  }
}
