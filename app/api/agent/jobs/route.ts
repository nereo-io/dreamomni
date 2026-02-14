/**
 * GET /api/agent/jobs
 * 获取用户的 Agent 任务列表 (Phase 4)
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAgentJobs, createAgentJob } from '@/lib/agent-api-client';
import type { AgentJob } from '@/types/agent';
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
    const includeShots = request.nextUrl.searchParams.get('include_shots') === 'true';
    const search = request.nextUrl.searchParams.get('search')?.trim();

    if (!search) {
      const jobs = await getAgentJobs(session.user.uuid, page, pageSize, includeShots);
      return NextResponse.json(jobs);
    }

    const normalizedSearch = search.toLowerCase();
    const allJobs: AgentJob[] = [];
    let pageToFetch = 1;
    let totalPages = 1;
    let pageSizeForFetch = pageSize;

    while (pageToFetch <= totalPages) {
      const data = await getAgentJobs(
        session.user.uuid,
        pageToFetch,
        pageSizeForFetch,
        includeShots
      );

      const jobsData = data.jobs || [];
      const total =
        typeof (data as any).total === 'number' ? (data as any).total : jobsData.length;
      const pageSizeFromResponse =
        typeof (data as any).page_size === 'number'
          ? (data as any).page_size
          : pageSizeForFetch;
      const totalPagesFromResponse =
        typeof (data as any).total_pages === 'number'
          ? (data as any).total_pages
          : Math.max(1, Math.ceil((total || 0) / (pageSizeFromResponse || pageSizeForFetch)));

      pageSizeForFetch = pageSizeFromResponse || pageSizeForFetch;
      totalPages = totalPagesFromResponse;
      allJobs.push(...jobsData);
      pageToFetch += 1;
    }

    const filteredJobs = allJobs.filter((job) =>
      (job.prompt || '').toLowerCase().includes(normalizedSearch)
    );
    const finalJobs = filteredJobs.filter((job) => job.final_video_url);
    const totalFiltered = finalJobs.length;
    const totalFilteredPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
    const startIndex = Math.max(0, (page - 1) * pageSize);
    const pageJobs = finalJobs.slice(startIndex, startIndex + pageSize);

    return NextResponse.json({
      jobs: pageJobs,
      total: totalFiltered,
      page,
      page_size: pageSize,
      total_pages: totalFilteredPages,
    });
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
