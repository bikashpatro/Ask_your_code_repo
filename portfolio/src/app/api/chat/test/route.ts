// app/api/chat/test/route.ts — quick Groq connectivity check
import Groq from 'groq-sdk';
import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ ok: false, error: 'GROQ_API_KEY is not set in .env.local' });
  }

  try {
    const groq = new Groq({ apiKey });
    const res = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: 'Reply with: OK' }],
      max_tokens: 10,
    });
    return NextResponse.json({ ok: true, reply: res.choices[0]?.message?.content });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : String(err) });
  }
}
