export const runtime = 'edge';

import { NextResponse } from 'next/server';

// POST /api/scrape/run — 触发 GitHub Actions 运行指定配方
export async function POST(request: Request) {
  try {
    const { recipeId } = await request.json() as { recipeId: number };

    const token = (process.env as any).GITHUB_TOKEN;
    const repo = 'yangwen008/zjd-web';

    if (!token) {
      return NextResponse.json({
        success: false,
        error: 'GITHUB_TOKEN 未配置。请在 Cloudflare 环境变量中设置 GitHub Personal Access Token。',
      }, { status: 500 });
    }

    // 触发 GitHub Actions workflow_dispatch
    const res = await fetch(`https://api.github.com/repos/${repo}/actions/workflows/scrape.yml/dispatches`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ref: 'main',
        inputs: {
          recipe_id: String(recipeId),
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({
        success: false,
        error: `GitHub API error: ${res.status} ${errText}`,
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: '已触发 GitHub Actions 采集任务，请在 Actions 页面查看进度',
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
