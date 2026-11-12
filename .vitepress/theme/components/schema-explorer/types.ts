export type RawRelation = { kind: string; from: string; to: string };
export type RawPlugin = { plugin: string; nodes: string[]; relations: RawRelation[] };
export type PluginGraphDocument = { plugins: RawPlugin[] };

export type Plugin = {
  id: string;
  label: string;
  short: string;
  group: string;
  groupLabel: string;
};
export type PluginGroup = { id: string; label: string; plugins: string[] };
export type GraphNode = { kind: string; sources: string[] };
export type GraphRelation = { kind: string; from: string; to: string; sources: string[] };
export type GraphModel = {
  plugins: Plugin[];
  groups: PluginGroup[];
  nodes: GraphNode[];
  relations: GraphRelation[];
};

export type Point = { x: number; y: number };
export type Layout = {
  positions: Map<string, Point>;
  routes: Map<string, Point[]>;
  width: number;
  height: number;
};
