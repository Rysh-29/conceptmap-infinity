import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { getViewportForBounds, type ReactFlowInstance } from 'reactflow';
import { getGraphBounds } from '../graph/bounds';
import type { ConceptNode } from '../types/graph';

const PX_PER_MM = 96 / 25.4;

const PAGE_SIZES_MM = {
  A4: { width: 210, height: 297 },
  A3: { width: 297, height: 420 },
};

const toPx = (mm: number) => Math.round(mm * PX_PER_MM);

type CaptureResult = {
  dataUrl: string;
  width: number;
  height: number;
};

async function captureMapImage(params: {
  container: HTMLElement;
  reactFlow: ReactFlowInstance;
  nodes: ConceptNode[];
  scale?: number;
}): Promise<CaptureResult> {
  const { container, reactFlow, nodes, scale = 2 } = params;
  const viewport = reactFlow.getViewport();

  const rect = container.getBoundingClientRect();
  const bounds = getGraphBounds(nodes);
  const padding = 80;

  const padded = {
    x: bounds.minX - padding,
    y: bounds.minY - padding,
    width: bounds.width + padding * 2,
    height: bounds.height + padding * 2,
  };

  const width = Math.max(Math.ceil(padded.width * scale), Math.ceil(rect.width));
  const height = Math.max(Math.ceil(padded.height * scale), Math.ceil(rect.height));

  const nextViewport = getViewportForBounds(padded, width, height, 0.05, 2, 0.1);
  reactFlow.setViewport(nextViewport, { duration: 0 });

  await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));

  const overlays = Array.from(
    container.querySelectorAll<HTMLElement>('.react-flow__controls, .react-flow__minimap, .react-flow__panel'),
  );
  const previousVisibility = overlays.map((el) => el.style.visibility);
  overlays.forEach((el) => {
    el.style.visibility = 'hidden';
  });

  let dataUrl = '';
  try {
    dataUrl = await toPng(container, {
      width,
      height,
      backgroundColor: '#ffffff',
      pixelRatio: 1,
    });
  } finally {
    overlays.forEach((el, index) => {
      el.style.visibility = previousVisibility[index];
    });
  }

  reactFlow.setViewport(viewport, { duration: 0 });

  return { dataUrl, width, height };
}

export async function exportPdfPoster(params: {
  container: HTMLElement;
  reactFlow: ReactFlowInstance;
  nodes: ConceptNode[];
  pageSize: keyof typeof PAGE_SIZES_MM;
  filename: string;
}) {
  const { container, reactFlow, nodes, pageSize, filename } = params;
  const { dataUrl, width, height } = await captureMapImage({ container, reactFlow, nodes });

  const pageMm = PAGE_SIZES_MM[pageSize];
  const pageWidth = toPx(pageMm.width);
  const pageHeight = toPx(pageMm.height);

  const cols = Math.max(1, Math.ceil(width / pageWidth));
  const rows = Math.max(1, Math.ceil(height / pageHeight));

  const doc = new jsPDF({
    unit: 'px',
    format: [pageWidth, pageHeight],
  });

  let isFirst = true;
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      if (!isFirst) {
        doc.addPage([pageWidth, pageHeight], 'portrait');
      }
      isFirst = false;
      const offsetX = -col * pageWidth;
      const offsetY = -row * pageHeight;
      doc.addImage(dataUrl, 'PNG', offsetX, offsetY, width, height);
    }
  }

  doc.save(filename);
}

export async function exportPdfSingle(params: {
  container: HTMLElement;
  reactFlow: ReactFlowInstance;
  nodes: ConceptNode[];
  filename: string;
}) {
  const { container, reactFlow, nodes, filename } = params;
  const { dataUrl, width, height } = await captureMapImage({ container, reactFlow, nodes });

  const doc = new jsPDF({
    unit: 'px',
    format: [width, height],
  });

  doc.addImage(dataUrl, 'PNG', 0, 0, width, height);
  doc.save(filename);
}
