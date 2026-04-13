// utils/generateReport.ts
// Generates a full capstone project report as a .docx file

import {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  AlignmentType, BorderStyle, ShadingType, Table, TableRow,
  TableCell, WidthType, convertInchesToTwip, PageBreak,
  TableOfContents, StyleLevel,
} from 'docx';
import { saveAs } from 'file-saver';

const VIOLET = '6D28D9';
const DARK   = '1E1B4B';
const GRAY   = '6B7280';
const WHITE  = 'FFFFFF';

// ── Helpers ──────────────────────────────────────────────────────────────────

function title(text: string): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 120 },
    children: [new TextRun({ text, bold: true, size: 56, color: DARK, font: 'Calibri' })],
  });
}

function subtitle(text: string): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 80 },
    children: [new TextRun({ text, size: 28, color: GRAY, font: 'Calibri' })],
  });
}

function sectionHeading(text: string, num: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 400, after: 160 },
    children: [
      new TextRun({ text: `${num}  `, bold: true, size: 32, color: VIOLET }),
      new TextRun({ text, bold: true, size: 32, color: DARK }),
    ],
  });
}

function subHeading(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 100 },
    children: [new TextRun({ text, bold: true, size: 26, color: DARK })],
  });
}

function body(text: string): Paragraph {
  return new Paragraph({
    spacing: { after: 120, line: 360 },
    children: [new TextRun({ text, size: 22, font: 'Calibri', color: '374151' })],
  });
}

function bullet(text: string, level = 0): Paragraph {
  return new Paragraph({
    bullet: { level },
    spacing: { after: 80, line: 320 },
    children: [new TextRun({ text, size: 22, font: 'Calibri', color: '374151' })],
  });
}

function boldBullet(label: string, rest: string, level = 0): Paragraph {
  return new Paragraph({
    bullet: { level },
    spacing: { after: 80, line: 320 },
    children: [
      new TextRun({ text: label, bold: true, size: 22, font: 'Calibri', color: DARK }),
      new TextRun({ text: ` ${rest}`, size: 22, font: 'Calibri', color: '374151' }),
    ],
  });
}

function pageBreak(): Paragraph {
  return new Paragraph({ children: [new PageBreak()] });
}

function divider(): Paragraph {
  return new Paragraph({
    spacing: { before: 200, after: 200 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' } },
    children: [],
  });
}

function infoTable(rows: [string, string][]): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rows.map(([label, value]) =>
      new TableRow({
        children: [
          new TableCell({
            width: { size: 30, type: WidthType.PERCENTAGE },
            shading: { type: ShadingType.SOLID, color: 'F3F4F6' },
            margins: { top: 100, bottom: 100, left: 150, right: 150 },
            borders: { top: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' }, bottom: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' }, left: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' }, right: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' } },
            children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, size: 20, font: 'Calibri', color: DARK })] })],
          }),
          new TableCell({
            width: { size: 70, type: WidthType.PERCENTAGE },
            margins: { top: 100, bottom: 100, left: 150, right: 150 },
            borders: { top: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' }, bottom: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' }, left: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' }, right: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' } },
            children: [new Paragraph({ children: [new TextRun({ text: value, size: 20, font: 'Calibri' })] })],
          }),
        ],
      })
    ),
  });
}

function techTable(headers: string[], rows: string[][]): Table {
  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((h) =>
      new TableCell({
        shading: { type: ShadingType.SOLID, color: VIOLET },
        margins: { top: 100, bottom: 100, left: 150, right: 150 },
        borders: { top: { style: BorderStyle.SINGLE, size: 1, color: VIOLET }, bottom: { style: BorderStyle.SINGLE, size: 1, color: VIOLET }, left: { style: BorderStyle.SINGLE, size: 1, color: VIOLET }, right: { style: BorderStyle.SINGLE, size: 1, color: VIOLET } },
        children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, size: 20, color: WHITE, font: 'Calibri' })] })],
      })
    ),
  });

  const dataRows = rows.map((row) =>
    new TableRow({
      children: row.map((cell) =>
        new TableCell({
          margins: { top: 80, bottom: 80, left: 150, right: 150 },
          borders: { top: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' }, bottom: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' }, left: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' }, right: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' } },
          children: [new Paragraph({ children: [new TextRun({ text: cell, size: 20, font: 'Calibri' })] })],
        })
      ),
    })
  );

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...dataRows],
  });
}

// ── Report sections ───────────────────────────────────────────────────────────

function coverPage(): Paragraph[] {
  return [
    new Paragraph({ spacing: { before: 1200 }, children: [] }),
    title('RepoBrainAI'),
    subtitle('AI-Powered Codebase Intelligence Platform'),
    new Paragraph({ spacing: { before: 400 }, children: [] }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [new TextRun({ text: 'Capstone Project Report', bold: true, size: 30, color: VIOLET })],
    }),
    new Paragraph({ spacing: { before: 600 }, children: [] }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: `Submitted: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`, size: 22, color: GRAY })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: 'IIT Patna — Generative AI Program', size: 22, color: GRAY })],
    }),
    pageBreak(),
  ];
}

function objectiveSection(): (Paragraph | Table)[] {
  return [
    sectionHeading('Objective', '1.'),
    body(
      'The primary objective of RepoBrainAI is to build an intelligent, AI-powered platform that enables software developers and teams to interact with their codebases using natural language queries. Rather than manually navigating thousands of files, developers can ask questions in plain English and receive accurate, citation-backed answers sourced directly from their repository.'
    ),
    body('Specific objectives include:'),
    bullet('Enable natural language querying of any local code repository.'),
    bullet('Automatically index repository files and expose them for context-aware AI responses.'),
    bullet('Support generation of architectural diagrams (flowcharts, sequence diagrams, class diagrams) directly from the codebase.'),
    bullet('Allow export of AI-generated responses and diagrams into Word (.docx) documents for documentation purposes.'),
    bullet('Maintain persistent, multi-session chat history so developers can refer back to prior analyses.'),
    bullet('Provide a fast, secure, and privacy-respecting solution using a free-tier AI backend (Groq — Llama 3.3 70B).'),
    divider(),
  ];
}

function problemStatementSection(): (Paragraph | Table)[] {
  return [
    sectionHeading('Problem Statement', '2.'),
    body(
      'Modern software projects often contain hundreds to thousands of files spanning multiple languages, frameworks, and layers. Onboarding new developers, conducting code reviews, generating documentation, or understanding a legacy codebase is an extremely time-consuming and error-prone process.'
    ),
    body('Key pain points faced by development teams today:'),
    boldBullet('Knowledge silos:', 'Critical architectural understanding is locked in senior developers\' heads and rarely documented.'),
    boldBullet('Poor discoverability:', 'Finding where a specific feature is implemented often requires exhaustive manual searches across files.'),
    boldBullet('Documentation lag:', 'Technical documentation is almost always outdated compared to the actual codebase.'),
    boldBullet('Slow onboarding:', 'New team members take weeks or months to become productive on large codebases.'),
    boldBullet('Diagram generation overhead:', 'Creating architecture or sequence diagrams from code is a manual, time-intensive process.'),
    body(
      'Existing tools like GitHub Copilot or Sourcegraph require cloud code upload, costly subscriptions, or IDE-specific integrations. There is no accessible, privacy-first, free-tier tool that allows developers to ask questions about their local codebase without sending code to a cloud service.'
    ),
    divider(),
  ];
}

function proposedSolutionSection(): (Paragraph | Table)[] {
  return [
    sectionHeading('Proposed Solution', '3.'),
    body(
      'RepoBrainAI addresses these problems by combining a modern web interface with a powerful AI backend to create a codebase question-answering (QA) system that works with any local repository.'
    ),
    subHeading('Core Features'),
    boldBullet('Folder-based Indexing:', 'Users select a local repository folder via the browser\'s File System Access API. Files are scanned client-side — no code is uploaded to any server.'),
    boldBullet('Natural Language Q&A:', 'Users ask plain English questions. The AI (Groq — Llama 3.3 70B) provides detailed, citation-backed answers referencing specific files.'),
    boldBullet('Diagram Generation:', 'Users can request architectural, sequence, or class diagrams. The AI returns Mermaid.js syntax that is rendered visually in the browser.'),
    boldBullet('Document Export:', 'Any AI response can be exported as a formatted Word (.docx) file. Diagrams can be downloaded as PNG images.'),
    boldBullet('Persistent Chat History:', 'All sessions are saved to localStorage via Redux Persist. Users can switch between, delete, or resume past sessions.'),
    boldBullet('Multi-session Support:', 'Users can create new sessions for different questions without losing prior context.'),
    subHeading('What Makes It Different'),
    bullet('No cloud code upload — files stay on the user\'s machine.'),
    bullet('Free-tier AI backend — no credit card or paid subscription required.'),
    bullet('Works with any language or framework.'),
    bullet('Runs entirely in the browser — no backend server required for the frontend.'),
    divider(),
  ];
}

function architectureSection(): (Paragraph | Table)[] {
  return [
    sectionHeading('System Architecture', '4.'),
    body('RepoBrainAI follows a two-layer architecture:'),
    subHeading('4.1  Frontend (Next.js App Router)'),
    body('The frontend is built with Next.js 16 using the App Router pattern. It handles all user interaction, file indexing, state management, and rendering.'),
    body('Key frontend components:'),
    boldBullet('HomeHero / RepoInput:', 'Landing page with folder picker using File System Access API.'),
    boldBullet('Sidebar:', 'Shows indexed files and persistent chat history with session switching.'),
    boldBullet('ChatInterface:', 'Message thread with user bubbles, AI responses, code blocks, citation pills, and diagram rendering.'),
    boldBullet('MermaidDiagram:', 'Renders AI-generated Mermaid syntax as visual SVG diagrams.'),
    boldBullet('Redux Store:', 'Manages repo state and chat sessions with redux-persist for localStorage persistence.'),
    subHeading('4.2  Backend (Next.js API Routes)'),
    body('The backend is a single Next.js API route (/api/chat) that:'),
    bullet('Receives the user\'s question, indexed file list, and conversation history.'),
    bullet('Constructs a system prompt with codebase context (capped at 80 files to stay within token limits).'),
    bullet('Calls the Groq API (Llama 3.3 70B model) for AI inference.'),
    bullet('Parses the response to extract text, code blocks, Mermaid diagrams, and file citations.'),
    bullet('Returns a structured JSON response to the frontend.'),
    subHeading('4.3  Data Flow'),
    body('User selects folder → Files scanned in browser → User types question → Frontend sends [question + file list + history] to /api/chat → Groq processes request → Response parsed → Rendered in chat UI.'),
    divider(),
  ];
}

function techStackSection(): (Paragraph | Table)[] {
  return [
    sectionHeading('Technology Stack', '5.'),
    new Paragraph({ spacing: { after: 160 }, children: [] }),
    techTable(
      ['Category', 'Technology', 'Version', 'Purpose'],
      [
        ['Frontend Framework', 'Next.js', '16.2.2', 'React-based full-stack framework with App Router'],
        ['UI Language', 'TypeScript', '5.x', 'Type-safe development'],
        ['Styling', 'Tailwind CSS', '4.x', 'Utility-first CSS framework'],
        ['UI Components', 'shadcn/ui', 'Latest', 'Accessible component library'],
        ['Animations', 'Framer Motion', '12.x', 'Smooth UI transitions'],
        ['Icons', 'Lucide React', 'Latest', 'Consistent icon set'],
        ['State Management', 'Redux Toolkit', '2.x', 'Predictable global state'],
        ['State Persistence', 'Redux Persist', 'Latest', 'localStorage-backed sessions'],
        ['AI Backend', 'Groq SDK', '0.x', 'Llama 3.3 70B inference'],
        ['Diagram Rendering', 'Mermaid.js', '11.x', 'SVG diagram generation'],
        ['Document Export', 'docx + file-saver', 'Latest', 'Word document generation'],
        ['Package Manager', 'npm', 'Latest', 'Dependency management'],
        ['File Access', 'File System Access API', 'Browser native', 'Local folder reading without upload'],
      ]
    ),
    new Paragraph({ spacing: { before: 200 }, children: [] }),
    divider(),
  ];
}

function securitySection(): (Paragraph | Table)[] {
  return [
    sectionHeading('Security and Data Privacy', '6.'),
    body(
      'RepoBrainAI is designed with a privacy-first philosophy. Unlike cloud-based code intelligence tools, it does not require users to upload their source code to any remote server.'
    ),
    subHeading('6.1  Data Handling'),
    boldBullet('File System Access API:', 'The browser\'s native directory picker is used to read files. The browser sandbox ensures only the selected directory is accessible — no other files on the system can be read.'),
    boldBullet('No code upload:', 'File contents are never sent to any server. Only a list of file paths (not contents) is sent to the Groq API for context.'),
    boldBullet('localStorage only:', 'Chat history is stored in the browser\'s localStorage. No data leaves the user\'s device except the question text and file names sent to Groq.'),
    subHeading('6.2  API Security'),
    boldBullet('Environment variables:', 'The Groq API key is stored server-side in .env.local and is never exposed to the browser.'),
    boldBullet('Server-side API calls:', 'All calls to the Groq API are made from the Next.js API route, not from the client, preventing key exposure.'),
    boldBullet('Input validation:', 'Questions are validated before being sent. Empty or whitespace-only queries are rejected.'),
    subHeading('6.3  Compliance Considerations'),
    bullet('Suitable for use with proprietary codebases as no source code is transmitted.'),
    bullet('GDPR-friendly: No user accounts, no tracking, no analytics.'),
    bullet('Suitable for air-gapped or restricted network environments when using a local LLM instead of Groq.'),
    divider(),
  ];
}

function benefitsSection(): (Paragraph | Table)[] {
  return [
    sectionHeading('Expected Benefits', '7.'),
    subHeading('7.1  For Individual Developers'),
    bullet('Reduce time spent navigating unfamiliar codebases by up to 70%.'),
    bullet('Instantly generate architecture and sequence diagrams without manual drawing tools.'),
    bullet('Export structured design documents for portfolio or academic submission.'),
    subHeading('7.2  For Development Teams'),
    bullet('Accelerate onboarding of new team members.'),
    bullet('Maintain up-to-date documentation generated directly from the live codebase.'),
    bullet('Facilitate code reviews by providing instant context on any file or module.'),
    subHeading('7.3  For Academic Use'),
    bullet('Helps students understand open-source projects for learning and research.'),
    bullet('Supports capstone project documentation generation.'),
    bullet('Can be used as a teaching aid for software architecture courses.'),
    divider(),
  ];
}

function developmentPlanSection(): (Paragraph | Table)[] {
  return [
    sectionHeading('Development Plan', '8.'),
    new Paragraph({ spacing: { after: 160 }, children: [] }),
    techTable(
      ['Phase', 'Activity', 'Status'],
      [
        ['Phase 1', 'Project setup — Next.js, TypeScript, Tailwind CSS, Redux', 'Completed'],
        ['Phase 2', 'UI implementation — Home page, Navbar, RepoInput, Recent Repos', 'Completed'],
        ['Phase 3', 'File System Access API integration — folder picker without upload dialog', 'Completed'],
        ['Phase 4', 'Groq AI integration — /api/chat route with context-aware prompting', 'Completed'],
        ['Phase 5', 'Mermaid.js diagram rendering — flowchart, sequence, class diagrams', 'Completed'],
        ['Phase 6', 'Document export — .docx generation with proper formatting', 'Completed'],
        ['Phase 7', 'Chat history persistence — redux-persist + localStorage', 'Completed'],
        ['Phase 8', 'Report generation — capstone project Word document export', 'Completed'],
        ['Phase 9 (Future)', 'RAG pipeline — embed and retrieve actual file contents for richer answers', 'Planned'],
        ['Phase 10 (Future)', 'Multi-repo support — index and switch between multiple repositories', 'Planned'],
      ]
    ),
    new Paragraph({ spacing: { before: 200 }, children: [] }),
    divider(),
  ];
}

function useCasesSection(): (Paragraph | Table)[] {
  return [
    sectionHeading('Example Use Cases', '9.'),
    subHeading('Use Case 1 — Understanding Authentication Flow'),
    body('A developer joins a new team working on a Python Flask application. Instead of reading through dozens of files, they index the repository and ask: "How does the authentication middleware work?" The AI instantly explains the JWT validation flow, references app.py:42 and models.py:18, and shows the relevant code block.'),
    subHeading('Use Case 2 — Generating Architecture Diagrams'),
    body('A team lead needs to present the system architecture to stakeholders. They ask: "Draw a flowchart of the project architecture." The AI generates a Mermaid diagram showing all modules and their relationships, which is downloaded as a PNG and inserted into the presentation.'),
    subHeading('Use Case 3 — DO-178C Compliance Documentation'),
    body('An aerospace software team needs design documentation to certify their C++ codebase against the DO-178C avionics standard. They index the repository, ask for a design document, and export the AI\'s structured response as a Word document with headings, bullet points, and code references.'),
    subHeading('Use Case 4 — Onboarding a New Developer'),
    body('A new developer needs to understand a large open-source C++ project (nlohmann/json). They clone the repo, index it in RepoBrainAI, and ask: "Explain the JSON parser architecture." The AI provides a clear explanation with file citations, helping the developer get productive in minutes instead of days.'),
    subHeading('Use Case 5 — Capstone Project Documentation'),
    body('A student needs to submit a capstone project report. They use RepoBrainAI\'s built-in report generator to produce a professional Word document covering all required sections — Objective, Problem Statement, Architecture, Tech Stack, and more — in minutes.'),
    divider(),
  ];
}

function conclusionSection(): (Paragraph | Table)[] {
  return [
    sectionHeading('Conclusion', '10.'),
    body(
      'RepoBrainAI represents a practical, privacy-first solution to one of software development\'s most persistent challenges: understanding and navigating complex codebases. By combining the power of large language models (Llama 3.3 70B via Groq) with a modern React/Next.js frontend, the platform delivers an intuitive, conversational interface that makes codebase intelligence accessible to developers of all experience levels.'
    ),
    body(
      'The project successfully demonstrates the application of Generative AI techniques — including context-aware prompting, structured output parsing, and diagram generation — to a real-world software engineering problem. It achieves this without requiring users to compromise on code privacy, pay for cloud services, or install complex infrastructure.'
    ),
    body(
      'Future enhancements will focus on implementing a full RAG (Retrieval-Augmented Generation) pipeline that reads and embeds actual file contents, enabling the AI to answer questions with deeper code-level understanding. Support for multiple simultaneous repositories and IDE integrations are also planned.'
    ),
    body(
      'RepoBrainAI is a demonstration of how Generative AI can meaningfully accelerate software development workflows — from onboarding and code review to documentation generation and architectural analysis.'
    ),
  ];
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function generateCapstoneReport(): Promise<void> {
  const children = [
    ...coverPage(),
    ...objectiveSection(),
    pageBreak(),
    ...problemStatementSection(),
    pageBreak(),
    ...proposedSolutionSection(),
    pageBreak(),
    ...architectureSection(),
    pageBreak(),
    ...techStackSection(),
    pageBreak(),
    ...securitySection(),
    pageBreak(),
    ...benefitsSection(),
    ...developmentPlanSection(),
    pageBreak(),
    ...useCasesSection(),
    pageBreak(),
    ...conclusionSection(),
  ];

  const doc = new Document({
    creator: 'RepoBrainAI',
    title: 'RepoBrainAI — Capstone Project Report',
    description: 'AI-Powered Codebase Intelligence Platform — Capstone Report',
    styles: {
      paragraphStyles: [
        {
          id: 'Normal',
          name: 'Normal',
          run: { font: 'Calibri', size: 22, color: '374151' },
          paragraph: { spacing: { line: 340 } },
        },
      ],
    },
    sections: [{
      properties: {
        page: {
          margin: {
            top: convertInchesToTwip(1),
            bottom: convertInchesToTwip(1),
            left: convertInchesToTwip(1.2),
            right: convertInchesToTwip(1),
          },
        },
      },
      children,
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `RepoBrainAI-Capstone-Report-${Date.now()}.docx`);
}