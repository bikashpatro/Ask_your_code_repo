// app/api/github-index/route.ts
// Fetches file tree from a public GitHub repository using the GitHub REST API

import { NextRequest, NextResponse } from 'next/server';

interface GitHubTreeItem {
  path: string;
  type: string;
  sha: string;
}

interface GitHubTreeResponse {
  tree: GitHubTreeItem[];
  truncated: boolean;
}

// Parse a GitHub URL and return { owner, repo, branch }
function parseGitHubUrl(url: string): { owner: string; repo: string; branch: string } | null {
  try {
    const cleaned = url.trim().replace(/\.git$/, '');
    const match = cleaned.match(
      /github\.com\/([^/]+)\/([^/]+)(?:\/tree\/([^/]+))?/
    );
    if (!match) return null;
    return {
      owner: match[1],
      repo: match[2],
      branch: match[3] ?? 'HEAD',
    };
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url?.trim()) {
      return NextResponse.json({ error: 'GitHub URL is required' }, { status: 400 });
    }

    const parsed = parseGitHubUrl(url);
    if (!parsed) {
      return NextResponse.json(
        { error: 'Invalid GitHub URL. Use format: https://github.com/owner/repo' },
        { status: 400 }
      );
    }

    const { owner, repo, branch } = parsed;

    // Fetch the full file tree recursively via GitHub API
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`;
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    };

    // Use token if available to increase rate limit (60 → 5000 req/hr)
    if (process.env.GITHUB_TOKEN) {
      headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;
    }

    const response = await fetch(apiUrl, { headers });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: `Repository "${owner}/${repo}" not found or is private` },
          { status: 404 }
        );
      }
      if (response.status === 403) {
        return NextResponse.json(
          { error: 'GitHub API rate limit exceeded. Try again in a minute.' },
          { status: 429 }
        );
      }
      return NextResponse.json(
        { error: `GitHub API error: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data: GitHubTreeResponse = await response.json();

    // Filter only files (not directories), assign ids
    const files = data.tree
      .filter((item) => item.type === 'blob')
      .map((item, i) => ({
        id: String(i + 1),
        name: item.path.split('/').pop() ?? item.path,
        path: item.path,
      }));

    return NextResponse.json({
      files,
      repoName: repo,
      owner,
      truncated: data.truncated,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
