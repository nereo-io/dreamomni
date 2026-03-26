import { NextResponse } from 'next/server';

import { locales } from '@/i18n/locale';
import { getPostsPageByLocale } from '@/models/post';

const DEFAULT_LIMIT = 24;
const MAX_LIMIT = 30;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get('locale') || 'en';
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const requestedLimit = parseInt(searchParams.get('limit') || `${DEFAULT_LIMIT}`, 10);
    const limit = Math.min(Math.max(requestedLimit, 1), MAX_LIMIT);

    if (!locales.includes(locale)) {
      return NextResponse.json(
        {
          code: 1,
          message: 'Invalid locale',
        },
        { status: 400 }
      );
    }

    const { posts, hasMore } = await getPostsPageByLocale(locale, page, limit);

    return NextResponse.json({
      code: 0,
      data: {
        items: posts,
        hasMore,
      },
      message: 'Blog posts fetched successfully',
    });
  } catch (error) {
    console.error('Unexpected error in blog posts API:', error);

    return NextResponse.json(
      {
        code: 1,
        message: 'Failed to fetch blog posts',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
