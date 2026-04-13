// app/api/chat/route.ts
// Groq-powered chat endpoint — answers questions about the indexed codebase

import Groq from 'groq-sdk';
import { NextRequest, NextResponse } from 'next/server';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Fix common AI-generated Mermaid syntax errors
function sanitizeMermaid(diagram: string): string {
  return diagram
    // Fix -->|label|> → -->|label|
    .replace(/-->\|([^|]*)\|>/g, '-->|$1|')
    // Fix --->|label|> and similar
    .replace(/-+>\|([^|]*)\|>/g, '-->|$1|')
    // Replace "graph " with "flowchart "
    .replace(/^graph\s+(TD|LR|RL|BT)/m, 'flowchart $1')
    // Remove any HTML tags inside labels
    .replace(/<[^>]+>/g, '')
    // Fix unquoted labels with special chars: A[My Node (thing)] → A["My Node (thing)"]
    .replace(/(\w+)\[([^\]"]*[()@#%&][^\]"]*)\]/g, '$1["$2"]');
}

export async function POST(req: NextRequest) {
  try {
    const { question, indexedFiles, history } = await req.json();

    if (!question?.trim()) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 });
    }

    // Build file context — cap at 80 files to stay within Groq's context limit
    const MAX_FILES = 80;
    const fileList: { name: string; path: string }[] = indexedFiles ?? [];
    const shown = fileList.slice(0, MAX_FILES);
    const hiddenCount = fileList.length - shown.length;

    const fileContext =
      shown.length > 0
        ? `The repository contains ${fileList.length} files. Here are the first ${shown.length}:\n${shown
            .map((f) => `- ${f.path || f.name}`)
            .join('\n')}${hiddenCount > 0 ? `\n... and ${hiddenCount} more files.` : ''}`
        : 'No files have been indexed yet.';

    // Build prior message history for multi-turn context (last 4 messages)
    const priorMessages = (history ?? [])
      .slice(-4)
      .map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `You are RepoBrainAI, an expert code assistant. You help developers understand their codebase.
${fileContext}

When answering:
- Be concise and precise
- Reference specific file names from the repository when relevant
- If you show code, use proper formatting
- Cite file names as "filename.ext:lineNumber" when referencing specific code locations
- When asked to draw or visualize anything, ALWAYS produce a \`\`\`mermaid code block. Choose the diagram type based on the request:

  SEQUENCE DIAGRAM — use when asked for "sequence diagram", "message flow", "interaction", "how modules talk":
  \`\`\`mermaid
  sequenceDiagram
      participant A as ModuleA
      participant B as ModuleB
      A->>B: callMethod()
      B-->>A: response
  \`\`\`

  FLOWCHART — use when asked for "architecture", "flow", "structure", "design diagram":
  \`\`\`mermaid
  flowchart TD
      A["Start"] --> B["Process"]
      B -->|result| C["End"]
  \`\`\`

  CLASS DIAGRAM — use when asked for "class diagram", "UML classes", "object model":
  \`\`\`mermaid
  classDiagram
      class Animal {
          +String name
          +speak()
      }
  \`\`\`

- STRICT Mermaid syntax rules:
  * In sequenceDiagram: use ->> for calls, -->> for replies, participant aliases must have no special chars
  * In flowchart: NEVER use "graph", always "flowchart TD" or "flowchart LR"
  * Node labels with spaces MUST be quoted: A["My Label"]
  * Edge labels: A -->|label| B  (no > after the closing pipe)
  * No HTML tags, no parentheses in unquoted labels`,
        },
        ...priorMessages,
        { role: 'user', content: question },
      ],
      temperature: 0.2,
      max_tokens: 768,
    });

    const content = completion.choices[0]?.message?.content ?? 'No response generated.';

    // Check for mermaid diagram block first
    const mermaidMatch = content.match(/```mermaid\n([\s\S]*?)```/);
    const mermaidDiagram = mermaidMatch ? sanitizeMermaid(mermaidMatch[1].trim()) : null;

    // Extract a regular code block (non-mermaid)
    const codeMatch = content.match(/```(?!mermaid)(\w+)?\n([\s\S]*?)```/);
    const codeBlock =
      !mermaidDiagram && codeMatch
        ? { language: codeMatch[1] ?? 'code', code: codeMatch[2].trim() }
        : null;

    // Strip all code blocks from the main text
    const textContent = content.replace(/```[\s\S]*?```/g, '').trim();

    // Extract file citations like "app.py:42" or "models.py"
    const citationRegex = /\b[\w/-]+\.\w{1,6}(?::\d+)?\b/g;
    const rawCitations = textContent.match(citationRegex) ?? [];
    const citations = [...new Set(rawCitations)].slice(0, 5);

    return NextResponse.json({ content: textContent, codeBlock, mermaidDiagram, citations });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[chat/route] error:', message);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}