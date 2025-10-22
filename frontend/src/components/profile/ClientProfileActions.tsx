'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type Props = {
  profileUrl: string;
  fileName?: string;
  qrRootId?: string; // default 'qr-root'
};

export default function ClientProfileActions({
  profileUrl,
  fileName = 'streakling-qr.png',
  qrRootId = 'qr-root'
}: Props) {
  const [flash, setFlash] = useState<string | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const showFlash = useCallback((msg: string) => {
    setFlash(msg);
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => setFlash(null), 1600);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  const onCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      showFlash('Link copied ✓');
    } catch {
      showFlash('Could not copy');
    }
  }, [profileUrl, showFlash]);

  const onDownload = useCallback(async () => {
    try {
      const root = document.getElementById(qrRootId || 'qr-root');
      if (!root) throw new Error('QR container not found');

      // 1) <canvas> → PNG
      const canvas = root.querySelector('canvas') as HTMLCanvasElement | null;
      if (canvas) {
        downloadDataUrl(canvas.toDataURL('image/png'), fileName);
        showFlash('QR downloaded ✓');
        return;
      }

      // 2) <img> (PNG or SVG data URL or remote)
      const imgEl = root.querySelector('img') as HTMLImageElement | null;
      if (imgEl && imgEl.src) {
        // If it's already a PNG data URL, save directly.
        if (imgEl.src.startsWith('data:image/png')) {
          downloadDataUrl(imgEl.src, fileName);
          showFlash('QR downloaded ✓');
          return;
        }
        // If it's an SVG data URL, rasterize it; otherwise draw the remote image onto canvas.
        if (imgEl.src.startsWith('data:image/svg+xml')) {
          const dataUrl = await rasterizeSvgUrlToPng(imgEl.src, 240, 240);
          downloadDataUrl(dataUrl, fileName);
          showFlash('QR downloaded ✓');
          return;
        }
        // Remote/other: draw onto canvas then export
        const dataUrl = await drawImageUrlToPng(imgEl.src, 240, 240);
        downloadDataUrl(dataUrl, fileName);
        showFlash('QR downloaded ✓');
        return;
      }

      // 3) <svg> → PNG
      const svg = root.querySelector('svg') as SVGSVGElement | null;
      if (svg) {
        const dataUrl = await rasterizeSvgElementToPng(svg);
        downloadDataUrl(dataUrl, fileName);
        showFlash('QR downloaded ✓');
        return;
      }

      throw new Error('QR canvas/svg/img not found');
    } catch (e) {
      console.error('QR download failed:', e);
      showFlash('Download failed');
    }
  }, [fileName, qrRootId, showFlash]);

  return (
    <div className='col-span-2 grid grid-cols-2 gap-2'>
      <button
        type='button'
        onClick={onCopy}
        data-stopflip='true'
        className='px-3 py-2 text-sm rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-800 text-center'
        aria-label='Copy profile link'
      >
        Copy link
      </button>
      <button
        type='button'
        onClick={onDownload}
        data-stopflip='true'
        className='px-3 py-2 text-sm rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-800 text-center'
        aria-label='Download QR as PNG'
      >
        Download PNG
      </button>

      {/* Flash toast */}
      <div
        aria-live='polite'
        className={`pointer-events-none fixed left-1/2 -translate-x-1/2 bottom-6 transition-all duration-200 ${
          flash ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
        }`}
      >
        {flash && (
          <div className='px-3 py-1.5 rounded-full bg-black/80 text-white text-xs shadow-lg'>
            {flash}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- helpers ---------- */

function downloadDataUrl(dataUrl: string, fileName: string) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

async function drawImageUrlToPng(src: string, width = 240, height = 240) {
  const img = new Image();
  img.crossOrigin = 'anonymous'; // avoid taint where possible
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
  const c = document.createElement('canvas');
  c.width = width;
  c.height = height;
  const ctx = c.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context not available');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);
  return c.toDataURL('image/png');
}

async function rasterizeSvgUrlToPng(svgUrl: string, width = 240, height = 240) {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = svgUrl;
  });
  const c = document.createElement('canvas');
  c.width = width;
  c.height = height;
  const ctx = c.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context not available');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);
  return c.toDataURL('image/png');
}

async function rasterizeSvgElementToPng(svg: SVGSVGElement) {
  // Clone + normalize size
  const cloned = svg.cloneNode(true) as SVGSVGElement;
  cloned.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  cloned.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
  let width = parseInt(cloned.getAttribute('width') || '', 10);
  let height = parseInt(cloned.getAttribute('height') || '', 10);
  const vb = cloned.getAttribute('viewBox');
  if ((!width || !height) && vb) {
    const [, , w, h] = vb.split(/\s+/).map(Number);
    width = width || Math.max(240, Math.floor(w || 240));
    height = height || Math.max(240, Math.floor(h || 240));
  }
  if (!width || !height) width = height = 240;
  cloned.setAttribute('width', String(width));
  cloned.setAttribute('height', String(height));

  // Ensure white background
  if (!cloned.querySelector('rect[fill]')) {
    const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bg.setAttribute('x', '0');
    bg.setAttribute('y', '0');
    bg.setAttribute('width', String(width));
    bg.setAttribute('height', String(height));
    bg.setAttribute('fill', '#fff');
    cloned.insertBefore(bg, cloned.firstChild);
  }

  const xml = new XMLSerializer().serializeToString(cloned);
  const blob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const dataUrl = await rasterizeSvgUrlToPng(url, width, height);
  URL.revokeObjectURL(url);
  return dataUrl;
}
