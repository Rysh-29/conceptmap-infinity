export const SCHEMA_VERSION = 1;

export type MapMetadata = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type ExportNode = {
  id: string;
  type: 'concept';
  position: { x: number; y: number };
  data: {
    label: string;
    style: {
      bgColor: string;
      borderColor: string;
      borderWidth: number;
      icon?: string;
    };
    collapsed?: boolean;
    parentId?: string;
  };
  width?: number;
  height?: number;
};

export type ExportEdge = {
  id: string;
  source: string;
  target: string;
  type?: string;
};

export type ExportMap = {
  id: string;
  version: number;
  metadata: MapMetadata;
  nodes: ExportNode[];
  edges: ExportEdge[];
};
