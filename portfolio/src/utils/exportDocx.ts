// utils/exportDocx.ts
// Converts an AI chat message into a formatted .docx Word document

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  ShadingType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  convertInchesToTwip,
} from 'docx';
import { saveAs } from 'file-saver';
import { ChatMessage } from '@/types';

// Parse a line of text and return TextRuns handling **bold** and `inline code`
function parseInline(text: string): TextRun[] {
  const runs: TextRun[] = [];
  // Split on **bold** and `code` markers
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  for (const part of parts) {
    if (part.startsWith('**') && part.endsWith('**')) {
      runs.push(new TextRun({ text: part.slice(2, -2), bold: true }));
    } else if (part.startsWith('`') && part.endsWith('`')) {
      runs.push(
        new TextRun({
          text: part.slice(1, -1),
          font: 'Courier New',
          size: 18,
          shading: { type: ShadingType.SOLID, color: 'E8E8E8' },
        })
      );
    } else if (part) {
      runs.push(new TextRun({ text: part }));
    }
  }
  return runs.length > 0 ? runs : [new TextRun({ text: text })];
}

// Convert message content text into an array of docx Paragraphs
function textToParagraphs(text: string): Paragraph[] {
  const paragraphs: Paragraph[] = [];
  const lines = text.split('\n');

  for (const raw of lines) {
    const line = raw.trimEnd();

    // Heading: ## or ###
    if (line.startsWith('### ')) {
      paragraphs.push(
        new Paragraph({ text: line.slice(4), heading: HeadingLevel.HEADING_3 })
      );
    } else if (line.startsWith('## ')) {
      paragraphs.push(
        new Paragraph({ text: line.slice(3), heading: HeadingLevel.HEADING_2 })
      );
    } else if (line.startsWith('# ')) {
      paragraphs.push(
        new Paragraph({ text: line.slice(2), heading: HeadingLevel.HEADING_1 })
      );
    }
    // Bullet: * or - or +
    else if (/^[\*\-\+] /.test(line)) {
      paragraphs.push(
        new Paragraph({
          children: parseInline(line.slice(2)),
          bullet: { level: 0 },
        })
      );
    }
    // Numbered list
    else if (/^\d+\. /.test(line)) {
      const content = line.replace(/^\d+\. /, '');
      paragraphs.push(
        new Paragraph({
          children: parseInline(content),
          numbering: { reference: 'default-numbering', level: 0 },
        })
      );
    }
    // Empty line → spacer
    else if (line.trim() === '') {
      paragraphs.push(new Paragraph({ text: '' }));
    }
    // Normal paragraph
    else {
      paragraphs.push(
        new Paragraph({ children: parseInline(line) })
      );
    }
  }

  return paragraphs;
}

// Build a code block as a shaded table
function codeBlockParagraph(language: string, code: string): (Paragraph | Table)[] {
  const header = new Paragraph({
    children: [
      new TextRun({
        text: language.toUpperCase(),
        bold: true,
        size: 16,
        color: '6D28D9',
      }),
    ],
    spacing: { before: 200 },
  });

  const codeTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { type: ShadingType.SOLID, color: 'F3F4F6' },
            margins: {
              top: convertInchesToTwip(0.1),
              bottom: convertInchesToTwip(0.1),
              left: convertInchesToTwip(0.15),
              right: convertInchesToTwip(0.15),
            },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1, color: 'D1D5DB' },
              bottom: { style: BorderStyle.SINGLE, size: 1, color: 'D1D5DB' },
              left: { style: BorderStyle.SINGLE, size: 1, color: 'D1D5DB' },
              right: { style: BorderStyle.SINGLE, size: 1, color: 'D1D5DB' },
            },
            children: code.split('\n').map(
              (line) =>
                new Paragraph({
                  children: [
                    new TextRun({
                      text: line || ' ',
                      font: 'Courier New',
                      size: 18,
                    }),
                  ],
                  spacing: { line: 240 },
                })
            ),
          }),
        ],
      }),
    ],
  });

  return [header, codeTable];
}

export async function exportMessageAsDocx(
  message: ChatMessage,
  repoName: string
): Promise<void> {
  const title = `CodeSearch AI — ${repoName}`;
  const timestamp = new Date().toLocaleString();

  const bodyChildren: (Paragraph | Table)[] = [
    // Document title
    new Paragraph({
      text: title,
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      children: [
        new TextRun({ text: `Generated: ${timestamp}`, size: 18, color: '6B7280' }),
      ],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({ text: '' }),

    // Main answer text
    ...textToParagraphs(message.content),
  ];

  // Append code block if present
  if (message.codeBlock) {
    bodyChildren.push(new Paragraph({ text: '' }));
    bodyChildren.push(...codeBlockParagraph(message.codeBlock.language, message.codeBlock.code));
  }

  // Append citations
  if (message.citations && message.citations.length > 0) {
    bodyChildren.push(new Paragraph({ text: '' }));
    bodyChildren.push(
      new Paragraph({
        children: [new TextRun({ text: 'References', bold: true, size: 22 })],
      })
    );
    for (const c of message.citations) {
      bodyChildren.push(
        new Paragraph({
          children: [new TextRun({ text: c, font: 'Courier New', size: 18 })],
          bullet: { level: 0 },
        })
      );
    }
  }

  const doc = new Document({
    numbering: {
      config: [
        {
          reference: 'default-numbering',
          levels: [
            {
              level: 0,
              format: 'decimal',
              text: '%1.',
              alignment: AlignmentType.LEFT,
            },
          ],
        },
      ],
    },
    sections: [
      {
        properties: {},
        children: bodyChildren,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const filename = `design-document-${Date.now()}.docx`;
  saveAs(blob, filename);
}