import type { GraphNode, GraphRelation, Layout, Point } from "./types";

function required<K, V>(map: Map<K, V>, key: K): V {
  const value = map.get(key);
  if (value === undefined) throw new Error(`Missing graph layout value for ${String(key)}`);
  return value;
}

export const NODE_W = 182;
export const NODE_H = 50;
export const HALF_W = NODE_W / 2;
export const pairKey = (from: string, to: string) => `${from}\u0000${to}`;
const COL_GAP = 350; // Distance between column centers.
const LANE_SEP = 30; // Minimum vertical spacing between items in a column.
const VIRTUAL_H = 14; // Virtual node height used to reserve an edge lane.
const PAD = 40;

/**
 * Computes a deterministic layered layout using a lightweight Sugiyama approach.
 * DFS omits back edges to break cycles; virtual nodes route long edges, and barycenter
 * sweeps reduce crossings. The complete graph is laid out so plugin filtering does not
 * move nodes.
 */
export function computeLayout(nodeList: GraphNode[], relationList: GraphRelation[]): Layout {
  const kinds = Array.from(new Set(nodeList.map((node) => node.kind))).sort();
  const known = new Set(kinds);
  if (!kinds.length) return { positions: new Map(), routes: new Map(), width: 400, height: 300 };

  // Keep only unique edges with known endpoints; self-loops are not used for layout.
  const seen = new Set<string>();
  const edges: [string, string][] = [];
  for (const relation of relationList) {
    if (relation.from === relation.to || !known.has(relation.from) || !known.has(relation.to))
      continue;
    const key = pairKey(relation.from, relation.to);
    if (seen.has(key)) continue;
    seen.add(key);
    edges.push([relation.from, relation.to]);
  }

  // Omit DFS back edges to produce an acyclic graph for layer assignment.
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
  const state = new Map<string, 1 | 2>();
  const dag: [string, string][] = [];
  const visit = (kind: string) => {
    state.set(kind, 1);
    for (const target of required(outgoing, kind).slice().sort()) {
      if (state.get(target) === 1) continue; // Ignore back edges when calculating the layout.
      dag.push([kind, target]);
      if (!state.get(target)) visit(target);
    }
    state.set(kind, 2);
  };
  for (const kind of roots) if (!state.get(kind)) visit(kind);

  // Assign each node to the layer of its longest path from a source.
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

  // Add virtual nodes to route edges that span multiple columns.
  const ids = [...kinds];
  const sizeOf = new Map<string, number>(kinds.map((kind) => [kind, NODE_H]));
  const links: [string, string][] = [];
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
  // Place isolated nodes at the bottom of the first column.
  const isolated = kinds.filter((kind) => !connected.has(kind));

  // Order nodes in each column using the barycenter heuristic.
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
    sweep(indices.slice(1), -1); // Order against neighbors in the previous columns.
    sweep(indices.slice(0, -1).reverse(), 1); // Order against neighbors in the following columns.
  }
  columns[0].push(...isolated);

  // Position nodes vertically near the average position of their neighbors.
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

  let top = Infinity;
  let bottom = -Infinity;
  for (const id of ids) {
    const nodeY = required(y, id);
    const nodeHeight = required(sizeOf, id);
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
  chains.forEach((chain, key) => {
    routes.set(key, chain.map(point));
  });
  return {
    positions,
    routes,
    width: PAD * 2 + NODE_W + (layerCount - 1) * COL_GAP,
    height: Math.max(300, bottom + offsetY + PAD),
  };
}
