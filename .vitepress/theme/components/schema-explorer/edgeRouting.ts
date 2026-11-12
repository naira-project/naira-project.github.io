import { HALF_W, NODE_H, pairKey } from "./graphLayout";
import type { GraphRelation, Point } from "./types";

export type PositionedNode = { kind: string; x: number; y: number };
export type RoutedEdge = {
  key: string;
  relation: GraphRelation;
  d: string;
  label: Point;
};

type Segment = [Point, Point, Point, Point];
type Rect = { x0: number; x1: number; y0: number; y1: number };
type PreparedEdge = {
  relation: GraphRelation;
  key: string;
  from: Point;
  to: Point;
  lane: number;
  route: Point[] | null;
  outPort: number;
  inPort: number;
};

const HALF_H = NODE_H / 2;
const RELATION_LANE_GAP = 24;
const PORT_MAX_OFFSET = 16;
const PORT_SPREAD = 34;
const BACK_EDGE_CONTROL_OFFSET = 95;
const SELF_LOOP_CONTROL_X = 95;
const SELF_LOOP_CONTROL_Y = 88;
const SELF_LOOP_ENDPOINT_Y = 8;
const LABEL_BASELINE_OFFSET = 4;
const LABEL_FRACTIONS = [0.5, 0.42, 0.58, 0.34, 0.66, 0.26, 0.74, 0.18, 0.82, 0.12, 0.88];
const CHAR_W = 3.4;
const LABEL_PAD = 6;
const LABEL_HEIGHT = 9;
const NODE_OVERLAP_PAD = 4;
const PLACED_LABEL_PAD = 3;
const OVERLAP_SCORE = 10;
const EDGE_CROSSING_SCORE = 1;
const portOffset = (count: number, index: number) =>
  count <= 1 ? 0 : (index - (count - 1) / 2) * Math.min(PORT_MAX_OFFSET, PORT_SPREAD / (count - 1));
const rectsOverlap = (a: Rect, b: Rect, pad = 0) =>
  a.x0 < b.x1 + pad && a.x1 > b.x0 - pad && a.y0 < b.y1 + pad && a.y1 > b.y0 - pad;

function smoothSegment(a: Point, b: Point): Segment {
  const dx = (b.x - a.x) / 2;
  return [a, { x: a.x + dx, y: a.y }, { x: b.x - dx, y: b.y }, b];
}

function segmentsToPath(segments: Segment[]) {
  const start = segments[0][0];
  return (
    `M ${start.x} ${start.y} ` +
    segments
      .map(([, c1, c2, end]) => `C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${end.x} ${end.y}`)
      .join(" ")
  );
}

function sampleSegments(segments: Segment[], steps = 18): Point[] {
  const points: Point[] = [];
  segments.forEach(([p0, p1, p2, p3], segmentIndex) => {
    for (let s = segmentIndex === 0 ? 0 : 1; s <= steps; s++) {
      const t = s / steps;
      const u = 1 - t;
      points.push({
        x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
        y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y,
      });
    }
  });
  return points;
}

function cumulativeLength(points: Point[]) {
  const lengths = [0];
  for (let i = 1; i < points.length; i++)
    lengths.push(
      lengths[i - 1] + Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y),
    );
  return lengths;
}

function pointAtFraction(points: Point[], lengths: number[], fraction: number): Point {
  const target = lengths[lengths.length - 1] * fraction;
  let index = 1;
  while (index < lengths.length - 1 && lengths[index] < target) index++;
  const span = lengths[index] - lengths[index - 1] || 1;
  const t = (target - lengths[index - 1]) / span;
  return {
    x: points[index - 1].x + (points[index].x - points[index - 1].x) * t,
    y: points[index - 1].y + (points[index].y - points[index - 1].y) * t,
  };
}

/** Builds edge paths and places labels to avoid nodes, other labels, and edge crossings. */
export function routeEdges(
  visibleRelations: GraphRelation[],
  visibleNodes: PositionedNode[],
  positions: Map<string, Point>,
  routes: Map<string, Point[]>,
): RoutedEdge[] {
  const relationGroups = new Map<string, GraphRelation[]>();
  for (const relation of visibleRelations) {
    const key = pairKey(relation.from, relation.to);
    const group = relationGroups.get(key) ?? [];
    group.push(relation);
    relationGroups.set(key, group);
  }

  const lanes = new Map<GraphRelation, number>();
  for (const group of relationGroups.values()) {
    group.forEach((relation, index) => {
      lanes.set(relation, (index - (group.length - 1) / 2) * RELATION_LANE_GAP);
    });
  }

  const prepared: PreparedEdge[] = [];
  visibleRelations.forEach((relation) => {
    const from = positions.get(relation.from);
    const to = positions.get(relation.to);
    if (!from || !to) return;
    const lane = lanes.get(relation);
    if (lane === undefined) throw new Error(`Missing edge lane for relation "${relation.kind}"`);
    // A null route means either a self-loop (routed explicitly below) or a back edge omitted by layout.
    const route =
      relation.from === relation.to
        ? null
        : (routes.get(pairKey(relation.from, relation.to)) ?? null);
    prepared.push({
      relation,
      key: `${relation.kind}\u0000${relation.from}\u0000${relation.to}`,
      from,
      to,
      lane,
      route: route?.map((point) => ({ x: point.x, y: point.y + lane })) ?? null,
      outPort: 0,
      inPort: 0,
    });
  });

  // Spread edge ports along each node side and order them to reduce crossings.
  const outgoing = new Map<string, PreparedEdge[]>();
  const incoming = new Map<string, PreparedEdge[]>();
  for (const item of prepared) {
    if (item.route === null) continue;
    outgoing.set(item.relation.from, [...(outgoing.get(item.relation.from) ?? []), item]);
    incoming.set(item.relation.to, [...(incoming.get(item.relation.to) ?? []), item]);
  }
  outgoing.forEach((group) => {
    group.sort((a, b) => (a.route?.[0]?.y ?? a.to.y) - (b.route?.[0]?.y ?? b.to.y));
    group.forEach((item, index) => {
      item.outPort = portOffset(group.length, index);
    });
  });
  incoming.forEach((group) => {
    group.sort((a, b) => {
      const aRoute = a.route;
      const bRoute = b.route;
      return (
        (aRoute?.[aRoute.length - 1]?.y ?? a.from.y) - (bRoute?.[bRoute.length - 1]?.y ?? b.from.y)
      );
    });
    group.forEach((item, index) => {
      item.inPort = portOffset(group.length, index);
    });
  });

  const built = prepared.map((item) => {
    const { from, to, lane } = item;
    let segments: Segment[];
    if (item.route !== null) {
      const anchors: Point[] = [{ x: from.x + HALF_W, y: from.y + item.outPort }];
      // Route edges straight through intermediate columns along their virtual-node lanes.
      for (const waypoint of item.route)
        anchors.push(
          { x: waypoint.x - HALF_W, y: waypoint.y },
          { x: waypoint.x + HALF_W, y: waypoint.y },
        );
      anchors.push({ x: to.x - HALF_W, y: to.y + item.inPort });
      segments = anchors.slice(1).map((anchor, index) => smoothSegment(anchors[index], anchor));
    } else if (item.relation.from === item.relation.to) {
      const x = from.x + HALF_W;
      const spread = lane;
      segments = [
        [
          { x, y: from.y - SELF_LOOP_ENDPOINT_Y },
          { x: x + SELF_LOOP_CONTROL_X + spread, y: from.y - SELF_LOOP_CONTROL_Y },
          { x: x + SELF_LOOP_CONTROL_X + spread, y: from.y + SELF_LOOP_CONTROL_Y },
          { x, y: from.y + SELF_LOOP_ENDPOINT_Y },
        ],
      ];
    } else if (from.x === to.x) {
      const direction = to.y >= from.y ? 1 : -1;
      const startX = from.x + HALF_W;
      const startY = from.y + direction * HALF_H;
      const endY = to.y - direction * HALF_H;
      const controlX = startX + BACK_EDGE_CONTROL_OFFSET + lane;
      segments = [
        [
          { x: startX, y: startY },
          { x: controlX, y: startY },
          { x: controlX, y: endY },
          { x: startX, y: endY },
        ],
      ];
    } else {
      const direction = to.x > from.x ? 1 : -1;
      segments = [
        smoothSegment(
          { x: from.x + direction * HALF_W, y: from.y },
          { x: to.x - direction * HALF_W, y: to.y },
        ),
      ];
    }
    return { item, segments };
  });

  const nodeRects: Rect[] = visibleNodes.map((node) => ({
    x0: node.x - HALF_W,
    x1: node.x + HALF_W,
    y0: node.y - HALF_H,
    y1: node.y + HALF_H,
  }));
  const samples = built.map(({ segments }) => sampleSegments(segments));
  const lengths = samples.map(cumulativeLength);
  const order = built
    .map((_, index) => index)
    .sort((a, b) => lengths[a][lengths[a].length - 1] - lengths[b][lengths[b].length - 1]);
  const placed: Rect[] = [];
  const labels: Point[] = new Array(built.length);

  for (const index of order) {
    const text = built[index].item.relation.kind;
    const halfWidth = text.length * CHAR_W + LABEL_PAD;
    const firstFraction = LABEL_FRACTIONS[0];
    const firstPoint = pointAtFraction(samples[index], lengths[index], firstFraction);
    const firstRect = {
      x0: firstPoint.x - halfWidth,
      x1: firstPoint.x + halfWidth,
      y0: firstPoint.y - LABEL_HEIGHT,
      y1: firstPoint.y + LABEL_HEIGHT,
    };
    let best = { point: firstPoint, rect: firstRect };
    let bestScore = scoreLabel(firstRect, index, samples, nodeRects, placed);
    for (const fraction of LABEL_FRACTIONS.slice(1)) {
      const point = pointAtFraction(samples[index], lengths[index], fraction);
      const rect = {
        x0: point.x - halfWidth,
        x1: point.x + halfWidth,
        y0: point.y - LABEL_HEIGHT,
        y1: point.y + LABEL_HEIGHT,
      };
      const score = scoreLabel(rect, index, samples, nodeRects, placed);
      if (score < bestScore) {
        best = { point, rect };
        bestScore = score;
        if (score === 0) break;
      }
    }
    placed.push(best.rect);
    labels[index] = { x: best.point.x, y: best.point.y + LABEL_BASELINE_OFFSET };
  }

  return built.map(({ item, segments }, index) => ({
    key: item.key,
    relation: item.relation,
    d: segmentsToPath(segments),
    label: labels[index],
  }));
}

function scoreLabel(
  rect: Rect,
  edgeIndex: number,
  samples: Point[][],
  nodeRects: Rect[],
  placedLabels: Rect[],
) {
  let score = 0;
  for (const nodeRect of nodeRects)
    if (rectsOverlap(rect, nodeRect, NODE_OVERLAP_PAD)) score += OVERLAP_SCORE;
  for (const labelRect of placedLabels)
    if (rectsOverlap(rect, labelRect, PLACED_LABEL_PAD)) score += OVERLAP_SCORE;
  const crossesOtherEdge = samples.some(
    (points, otherIndex) =>
      otherIndex !== edgeIndex &&
      points.some(
        (point) => point.x > rect.x0 && point.x < rect.x1 && point.y > rect.y0 && point.y < rect.y1,
      ),
  );
  if (crossesOtherEdge) score += EDGE_CROSSING_SCORE;
  return score;
}
