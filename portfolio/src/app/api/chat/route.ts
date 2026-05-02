// app/api/chat/route.ts
// Multi-provider chat endpoint — supports Groq, OpenAI, Anthropic, Ollama

import Groq from 'groq-sdk';
import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

// Fix common AI-generated Mermaid syntax errors
function sanitizeMermaid(diagram: string): string {
  return diagram
    .replace(/-->\|([^|]*)\|>/g, '-->|$1|')
    .replace(/-+>\|([^|]*)\|>/g, '-->|$1|')
    .replace(/^graph\s+(TD|LR|RL|BT)/m, 'flowchart $1')
    .replace(/<[^>]+>/g, '')
    .replace(/(\w+)\[([^\]"]*[()@#%&][^\]"]*)\]/g, '$1["$2"]');
}

// Parse and structure the LLM response text
function parseResponse(content: string) {
  const mermaidMatch = content.match(/```mermaid\n([\s\S]*?)```/);
  const mermaidDiagram = mermaidMatch ? sanitizeMermaid(mermaidMatch[1].trim()) : null;
  const codeMatch = content.match(/```(?!mermaid)(\w+)?\n([\s\S]*?)```/);
  const codeBlock = !mermaidDiagram && codeMatch
    ? { language: codeMatch[1] ?? 'code', code: codeMatch[2].trim() }
    : null;
  const textContent = content.replace(/```[\s\S]*?```/g, '').trim();
  const rawCitations = textContent.match(/\b[\w/-]+\.\w{1,6}(?::\d+)?\b/g) ?? [];
  const citations = [...new Set(rawCitations)].slice(0, 5);
  return { content: textContent, codeBlock, mermaidDiagram, citations };
}

// Build system prompt with indexed file context
function buildSystemPrompt(fileList: { name: string; path: string }[]): string {
  const fileContext = fileList.length > 0
    ? `Here are the ${fileList.length} most relevant files for this query:\n${fileList.map((f) => `- ${f.path || f.name}`).join('\n')}`
    : 'No files have been indexed yet.';
  return `You are RepoBrainAI, an expert code assistant. You help developers understand their codebase.
${fileContext}

When answering:
- Be concise and precise
- Reference specific file names when relevant, cite as "filename.ext:lineNumber"
- Use proper code formatting
- When asked to visualize, produce a \`\`\`mermaid code block (flowchart TD, sequenceDiagram, or classDiagram)
- STRICT Mermaid: use "flowchart TD" not "graph", quote labels with spaces A["My Label"], edge labels: A -->|label| B`;
}

type ChatMessage = { role: 'user' | 'assistant'; content: string };

async function callGroq(apiKey: string, model: string, system: string, messages: ChatMessage[]) {
  if (!apiKey) throw new Error('Groq API key is required. Add it in LLM Provider Settings.');
  const groq = new Groq({ apiKey });
  const res = await groq.chat.completions.create({
    model, temperature: 0.2, max_tokens: 768,
    messages: [{ role: 'system', content: system }, ...messages],
  });
  return res.choices[0]?.message?.content ?? '';
}

async function callOpenAI(apiKey: string, model: string, system: string, messages: ChatMessage[]) {
  if (!apiKey) throw new Error('OpenAI API key is required. Add it in LLM Provider Settings.');
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, temperature: 0.2, max_tokens: 768, messages: [{ role: 'system', content: system }, ...messages] }),
  });
  if (!res.ok) throw new Error(`OpenAI error: ${res.statusText}`);
  const data = await res.json();
  return data.choices[0]?.message?.content ?? '';
}

async function callAnthropic(apiKey: string, model: string, system: string, messages: ChatMessage[]) {
  if (!apiKey) throw new Error('Anthropic API key is required. Add it in LLM Provider Settings.');
  const client = new Anthropic({ apiKey });
  const res = await client.messages.create({ model, system, max_tokens: 768, messages });
  const block = res.content[0];
  return block.type === 'text' ? block.text : '';
}


export async function POST(req: NextRequest) {
  try {
    const { question, indexedFiles, history, llmConfig } = await req.json();
    if (!question?.trim()) return NextResponse.json({ error: 'Question is required' }, { status: 400 });

    const provider = llmConfig?.provider ?? 'groq';
    const apiKey = llmConfig?.apiKey ?? '';
    const model = llmConfig?.model ?? 'llama-3.3-70b-versatile';

    const system = buildSystemPrompt(indexedFiles ?? []);
    const prior: ChatMessage[] = (history ?? []).slice(-4).map((m: { role: string; content: string }) => ({
      role: m.role as 'user' | 'assistant', content: m.content,
    }));
    const messages: ChatMessage[] = [...prior, { role: 'user', content: question }];

    let raw = '';
    if (provider === 'groq') raw = await callGroq(apiKey, model, system, messages);
    else if (provider === 'openai') raw = await callOpenAI(apiKey, model, system, messages);
    else if (provider === 'anthropic') raw = await callAnthropic(apiKey, model, system, messages);

    return NextResponse.json(parseResponse(raw));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[chat/route] error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
