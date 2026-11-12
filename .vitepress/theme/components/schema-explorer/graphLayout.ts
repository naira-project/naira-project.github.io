import { pairKey } from "./keys";
import type { GraphNode, GraphRelation, Layout, Point } from "./types";

export const NODE_W = 182;
export const NODE_H = 50;
export const HALF_W = NODE_W / 2;
export const HALF_H = NODE_H / 2;
export const MIN_WIDTH = 400;
export const MIN_HEIGHT = 300;
const COL_GAP = 350; // Distance between column centers.
const LANE_SEP = 30; // Minimum vertical spacing between items in a column.
const VIRTUAL_H = 14; // Virtual node height used to reserve an edge lane.
const PAD = 40;
const DFS_VISITING = 1;
const DFS_DONE = 2;

type Edge = [from: string, to: string];
type VirtualGraph = {
  ids: string[];
  sizeOf: Map<string, number>;
  links: Edge[];
  chains: Map<string, string[]>;
};
type OrderedGraph = {
  ids: string[];
  sizeOf: Map<string, number>;
  layerOf: Map<string, number>;
  neighbors: Map<string, string[]>;
  columns: string[][];
  chains: Map<string, string[]>;
};

function required<K, V>(map: Map<K, V>, key: K): V {
  const value = map.get(key);
  if (value === undefined) throw new Error(`Missing graph layout value for ${String(key)}`);
  return value;
}

function acyclicEdges(kinds: string[], relations: GraphRelation[]): Edge[] {
  const known = new Set(kinds);
  const seen = new Set<string>();
  const edges: Edge[] = [];
  for (const relation of relations) {
    if (relation.from === relation.to || !known.has(relation.from) || !known.has(relation.to))
      continue;
    const key = pairKey(relation.from, relation.to);
    if (seen.has(key)) continue;
    seen.add(key);
    edges.push([relation.from, relation.to]);
  }

  const outgoing = new Map(kinds.map((kind) => [kind, [] as string[]]));
  const hasIncomingRaw = new Set<string>();
  for (const [from, to] of edges) {
    required(outgoing, from).push(to);
    hasIncomingRaw.add(to);
  }
  const roots = [
    ...kinds.filter((kind) => !hasIncomingRaw.has(kind)),
    ...kinds.filter((kind) => hasIncomingRaw.has(kind)),
  ];
  const state = new Map<string, number>();
  const dag: Edge[] = [];
  const visit = (kind: string) => {
    state.set(kind, DFS_VISITING);
    for (const target of required(outgoing, kind).slice().sort()) {
      if (state.get(target) === DFS_VISITING) continue;
      dag.push([kind, target]);
      if (!state.has(target)) visit(target);
    }
    state.set(kind, DFS_DONE);
  };
  for (const kind of roots) if (!state.has(kind)) visit(kind);
  return dag;
}

function assignLayers(kinds: string[], dag: Edge[]): Map<string, number> {
  const layerOf = new Map(kinds.map((kind) => [kind, 0]));
  for (let pass = 0; pass < kinds.length; pass++) {
    let changed = false;
    for (const [from, to] of dag) {
      const targetLayer = required(layerOf, to);
      const nextLayer = required(layerOf, from) + 1;
      if (targetLayer < nextLayer) {
        layerOf.set(to, nextLayer);
        changed = true;
      }
    }
    if (!changed) break;
  }

  const hasIncoming = new Set(dag.map(([, to]) => to));
  for (const kind of kinds) {
    if (hasIncoming.has(kind)) continue;
    const successors = dag.filter(([from]) => from === kind).map(([, to]) => required(layerOf, to));
    if (successors.length) layerOf.set(kind, Math.min(...successors) - 1);
  }
  return layerOf;
}

function insertVirtualNodes(
  kinds: string[],
  dag: Edge[],
  layerOf: Map<string, number>,
): VirtualGraph {
  const ids = [...kinds];
  const sizeOf = new Map<string, number>(kinds.map((kind) => [kind, NODE_H]));
  const links: Edge[] = [];
  const chains = new Map<string, string[]>();
  for (const [from, to] of dag) {
    const fromLayer = required(layerOf, from);
    const span = required(layerOf, to) - fromLayer;
    const chain: string[] = [];
    let previous = from;
    for (let step = 1; step < span; step++) {
      const id = `\u0001${from}\u0000${to}\u0000${step}`;
      layerOf.set(id, fromLayer + step);
      sizeOf.set(id, VIRTUAL_H);
      ids.push(id);
      chain.push(id);
      links.push([previous, id]);
      previous = id;
    }
    links.push([previous, to]);
    chains.set(pairKey(from, to), chain);
  }
  return { ids, sizeOf, links, chains };
}

function orderColumns(
  kinds: string[],
  layerOf: Map<string, number>,
  virtual: VirtualGraph,
): OrderedGraph {
  const { ids, sizeOf, links, chains } = virtual;
  const connected = new Set<string>();
  const neighbors = new Map(ids.map((id) => [id, [] as string[]]));
  for (const [a, b] of links) {
    connected.add(a);
    connected.add(b);
    required(neighbors, a).push(b);
    required(neighbors, b).push(a);
  }

  const layerCount = Math.max(0, ...kinds.map((kind) => required(layerOf, kind))) + 1;
  const columns: string[][] = Array.from({ length: layerCount }, () => []);
  for (const id of ids) {
    if (!connected.has(id)) continue;
    const column = columns[required(layerOf, id)];
    if (!column) throw new Error(`Missing graph layout column for ${id}`);
    column.push(id);
  }
  const isolated = kinds.filter((kind) => !connected.has(kind));

  const rank = new Map<string, number>();
  const refreshRanks = (column: string[]) => {
    column.forEach((id, index) => {
      rank.set(id, (index + 0.5) / column.length);
    });
  };
  columns.forEach(refreshRanks);
  const sweep = (order: number[], direction: -1 | 1) => {
    for (const index of order) {
      const column = columns[index];
      const score = new Map<string, number>();
      for (const id of column) {
        const adjacent = required(neighbors, id).filter(
          (other) => (required(layerOf, other) - index) * direction > 0,
        );
        const idRank = required(rank, id);
        score.set(
          id,
          adjacent.length
            ? adjacent.reduce((sum, other) => sum + required(rank, other), 0) / adjacent.length
            : idRank,
        );
      }
      const previous = new Map(column.map((id, i) => [id, i]));
      column.sort(
        (a, b) =>
          required(score, a) - required(score, b) || required(previous, a) - required(previous, b),
      );
      refreshRanks(column);
    }
  };
  const indices = columns.map((_, index) => index);
  for (let iteration = 0; iteration < 10; iteration++) {
    sweep(indices.slice(1), -1);
    sweep(indices.slice(0, -1).reverse(), 1);
  }
  columns[0].push(...isolated);
  return { ids, sizeOf, layerOf, neighbors, columns, chains };
}

function assignY(
  columns: string[][],
  sizeOf: Map<string, number>,
  neighbors: Map<string, string[]>,
) {
  const gap = (a: string, b: string) => (required(sizeOf, a) + required(sizeOf, b)) / 2 + LANE_SEP;
  const y = new Map<string, number>();
  columns.forEach((column) => {
    column.forEach((id, i) => {
      y.set(id, i === 0 ? 0 : required(y, column[i - 1]) + gap(column[i - 1], id));
    });
  });
  const place = (column: string[]) => {
    if (!column.length) return;
    const desired = column.map((id) => {
      const adjacent = required(neighbors, id);
      return adjacent.length
        ? adjacent.reduce((sum, other) => sum + required(y, other), 0) / adjacent.length
        : required(y, id);
    });
    const actual = desired.slice();
    for (let i = 1; i < actual.length; i++) {
      actual[i] = Math.max(actual[i], actual[i - 1] + gap(column[i - 1], column[i]));
    }
    const shift = desired.reduce((sum, value, i) => sum + value - actual[i], 0) / column.length;
    column.forEach((id, i) => {
      y.set(id, actual[i] + shift);
    });
  };
  for (let iteration = 0; iteration < 10; iteration++) {
    columns.forEach(place);
    columns.slice().reverse().forEach(place);
  }
  return y;
}

/**
 * Computes a deterministic layered layout using a lightweight Sugiyama approach.
 * The complete graph is laid out so plugin filtering does not move nodes.
 */
export function computeLayout(nodeList: GraphNode[], relationList: GraphRelation[]): Layout {
  const kinds = Array.from(new Set(nodeList.map((node) => node.kind))).sort();
  if (!kinds.length) {
    return { positions: new Map(), routes: new Map(), width: MIN_WIDTH, height: MIN_HEIGHT };
  }

  const dag = acyclicEdges(kinds, relationList);
  const layerOf = assignLayers(kinds, dag);
  const virtual = insertVirtualNodes(kinds, dag, layerOf);
  const ordered = orderColumns(kinds, layerOf, virtual);
  const y = assignY(ordered.columns, ordered.sizeOf, ordered.neighbors);

  let top = Infinity;
  let bottom = -Infinity;
  for (const id of ordered.ids) {
    const nodeY = required(y, id);
    const nodeHeight = required(ordered.sizeOf, id);
    top = Math.min(top, nodeY - nodeHeight / 2);
    bottom = Math.max(bottom, nodeY + nodeHeight / 2);
  }
  const offsetY = PAD - top;
  const point = (id: string): Point => ({
    x: PAD + HALF_W + required(layerOf, id) * COL_GAP,
    y: required(y, id) + offsetY,
  });
  const positions = new Map<string, Point>(kinds.map((kind) => [kind, point(kind)]));
  const routes = new Map<string, Point[]>();
  ordered.chains.forEach((chain, key) => {
    routes.set(key, chain.map(point));
  });

  return {
    positions,
    routes,
    width: PAD * 2 + NODE_W + (ordered.columns.length - 1) * COL_GAP,
    height: Math.max(MIN_HEIGHT, bottom + offsetY + PAD),
  };
}
