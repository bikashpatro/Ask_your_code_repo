// components/MermaidDiagram.tsx
// Renders a Mermaid diagram with Copy source and Download PNG options

'use client';

import { useEffect, useRef, useId, useState } from 'react';
import mermaid from 'mermaid';
import { Copy, Check, Download } from 'lucide-react';

export default function MermaidDiagram({ chart }: { chart: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const uid = useId().replace(/:/g, '');
  const renderedRef = useRef(false);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Copy raw Mermaid source text
  const handleCopy = async () => {
    await navigator.clipboard.writeText(chart);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Export the rendered SVG as a PNG and trigger download
  const handleDownloadPng = () => {
    const svgEl = containerRef.current?.querySelector('svg');
    if (!svgEl) return;
    setDownloading(true);

    try {
      // Clone and ensure xmlns is set (required for standalone SVG)
      const clone = svgEl.cloneNode(true) as SVGSVGElement;
      clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

      // Get dimensions
      const width = svgEl.clientWidth || 800;
      const height = svgEl.clientHeight || 600;
      clone.setAttribute('width', String(width));
      clone.setAttribute('height', String(height));

      // Encode SVG as base64 data URL — avoids tainted canvas CORS issue
      const svgData = new XMLSerializer().serializeToString(clone);
      const encoded = btoa(
        encodeURIComponent(svgData).replace(/%([0-9A-F]{2})/gi, (_, hex) =>
          String.fromCharCode(parseInt(hex, 16))
        )
      );
      const dataUrl = `data:image/svg+xml;base64,${encoded}`;

      const scale = 2;
      const canvas = document.createElement('canvas');
      canvas.width = width * scale;
      canvas.height = height * scale;

      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#0d1117';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.scale(scale, scale);

      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        const link = document.createElement('a');
        link.download = 'diagram.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
        setDownloading(false);
      };
      img.onerror = () => setDownloading(false);
      img.src = dataUrl;
    } catch {
      setDownloading(false);
    }
  };

  useEffect(() => {
    if (renderedRef.current) return;
    if (!containerRef.current) return;
    renderedRef.current = true;

    mermaid.initialize({
      startOnLoad: false,
      theme: 'dark',
      suppressErrorRendering: true,
      themeVariables: {
        background: '#0d1117',
        primaryColor: '#6d28d9',
        primaryTextColor: '#e2e8f0',
        primaryBorderColor: '#4c1d95',
        lineColor: '#7c3aed',
        secondaryColor: '#161b22',
        tertiaryColor: '#161b22',
        edgeLabelBackground: '#161b22',
        nodeTextColor: '#e2e8f0',
        fontSize: '13px',
      },
      flowchart: { curve: 'basis', useMaxWidth: true, htmlLabels: false },
    });

    const id = `mermaid-${uid}`;
    const container = containerRef.current;

    mermaid
      .render(id, chart)
      .then(({ svg }) => {
        if (container) container.innerHTML = svg;
      })
      .catch(() => {
        if (container) {
          container.innerHTML = `
            <div style="color:#f87171;font-size:11px;padding:8px;">
              Could not render diagram. The AI generated invalid Mermaid syntax.
              <pre style="margin-top:6px;font-size:10px;opacity:0.6;white-space:pre-wrap">${chart}</pre>
            </div>`;
        }
      });

    return () => {
      renderedRef.current = false;
    };
  }, [chart, uid]);

  return (
    <div className="bg-[#0d1117] border border-white/10 rounded-xl overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
        <span className="text-[10px] text-slate-500 uppercase tracking-wider">Diagram</span>

        <div className="flex items-center gap-3">
          {/* Copy source button */}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-[10px] text-slate-500 hover:text-slate-200 transition-colors"
          >
            {copied ? (
              <><Check size={11} className="text-emerald-400" /><span className="text-emerald-400">Copied!</span></>
            ) : (
              <><Copy size={11} /><span>Copy</span></>
            )}
          </button>

          {/* Download PNG button */}
          <button
            onClick={handleDownloadPng}
            disabled={downloading}
            className="flex items-center gap-1.5 text-[10px] text-slate-500 hover:text-violet-400 transition-colors disabled:opacity-40"
          >
            <Download size={11} />
            <span>{downloading ? 'Saving…' : 'Download PNG'}</span>
          </button>
        </div>
      </div>

      {/* Diagram canvas */}
      <div
        ref={containerRef}
        className="px-4 py-4 overflow-x-auto flex justify-center [&>svg]:max-w-full [&>svg]:h-auto"
      />
    </div>
  );
}