export type Point = { x: number; y: number }
export type GraphNode = { kind: string; sources: string[] }
export type GraphRelation = { kind: string; from: string; to: string; sources: string[] }
export type Layout = { positions: Map<string, Point>; routes: Map<string, Point[]>; width: number; height: number }

export const NODE_W = 182
export const NODE_H = 50
const HALF_W = NODE_W / 2
const COL_GAP = 350 // Distance between column centers.
const LANE_SEP = 30 // Minimum vertical spacing between items in a column.
const VIRTUAL_H = 14 // Virtual node height used to reserve an edge lane.
const PAD = 40

const edgeKey = (from: string, to: string) => `${from}\u0000${to}`

/**
 * Computes a deterministic layered layout using a lightweight Sugiyama approach.
 * DFS omits back edges to break cycles; virtual nodes route long edges, and barycenter
 * sweeps reduce crossings. The complete graph is laid out so plugin filtering does not
 * move nodes.
 */
export function computeLayout(nodeList: GraphNode[], relationList: GraphRelation[]): Layout {
  const kinds = Array.from(new Set(nodeList.map((node) => node.kind))).sort()
  const known = new Set(kinds)
  if (!kinds.length) return { positions: new Map(), routes: new Map(), width: 400, height: 300 }

  // Keep only unique edges with known endpoints; self-loops are not used for layout.
  const seen = new Set<string>()
  const edges: [string, string][] = []
  for (const relation of relationList) {
    if (relation.from === relation.to || !known.has(relation.from) || !known.has(relation.to)) continue
    const key = edgeKey(relation.from, relation.to)
    if (seen.has(key)) continue
    seen.add(key)
    edges.push([relation.from, relation.to])
  }

  // Omit DFS back edges to produce an acyclic graph for layer assignment.
  const outgoing = new Map(kinds.map((kind) => [kind, [] as string[]]))
  const hasIncomingRaw = new Set<string>()
  for (const [from, to] of edges) {
    outgoing.get(from)!.push(to)
    hasIncomingRaw.add(to)
  }
  const roots = [...kinds.filter((kind) => !hasIncomingRaw.has(kind)), ...kinds.filter((kind) => hasIncomingRaw.has(kind))]
  const state = new Map<string, 1 | 2>()
  const dag: [string, string][] = []
  const visit = (kind: string) => {
    state.set(kind, 1)
    for (const target of outgoing.get(kind)!.slice().sort()) {
      if (state.get(target) === 1) continue // Ignore back edges when calculating the layout.
      dag.push([kind, target])
      if (!state.get(target)) visit(target)
    }
    state.set(kind, 2)
  }
  for (const kind of roots) if (!state.get(kind)) visit(kind)

  // Assign each node to the layer of its longest path from a source.
  const layerOf = new Map(kinds.map((kind) => [kind, 0]))
  for (let pass = 0; pass < kinds.length; pass++) {
    let changed = false
    for (const [from, to] of dag) {
      if (layerOf.get(to)! < layerOf.get(from)! + 1) {
        layerOf.set(to, layerOf.get(from)! + 1)
        changed = true
      }
    }
    if (!changed) break
  }
  const hasIncoming = new Set(dag.map(([, to]) => to))
  for (const kind of kinds) {
    if (hasIncoming.has(kind)) continue
    const successors = dag.filter(([from]) => from === kind).map(([, to]) => layerOf.get(to)!)
    if (successors.length) layerOf.set(kind, Math.min(...successors) - 1)
  }

  // Add virtual nodes to route edges that span multiple columns.
  const ids = [...kinds]
  const sizeOf = new Map<string, number>(kinds.map((kind) => [kind, NODE_H]))
  const links: [string, string][] = []
  const chains = new Map<string, string[]>()
  for (const [from, to] of dag) {
    const span = layerOf.get(to)! - layerOf.get(from)!
    const chain: string[] = []
    let previous = from
    for (let step = 1; step < span; step++) {
      const id = `\u0001${from}\u0000${to}\u0000${step}`
      layerOf.set(id, layerOf.get(from)! + step)
      sizeOf.set(id, VIRTUAL_H)
      ids.push(id)
      chain.push(id)
      links.push([previous, id])
      previous = id
    }
    links.push([previous, to])
    chains.set(edgeKey(from, to), chain)
  }

  const connected = new Set<string>()
  const neighbors = new Map(ids.map((id) => [id, [] as string[]]))
  for (const [a, b] of links) {
    connected.add(a)
    connected.add(b)
    neighbors.get(a)!.push(b)
    neighbors.get(b)!.push(a)
  }

  const layerCount = Math.max(0, ...kinds.map((kind) => layerOf.get(kind)!)) + 1
  const columns: string[][] = Array.from({ length: layerCount }, () => [])
  for (const id of ids) if (connected.has(id)) columns[layerOf.get(id)!].push(id)
  // Place isolated nodes at the bottom of the first column.
  const isolated = kinds.filter((kind) => !connected.has(kind))

  // Order nodes in each column using the barycenter heuristic.
  const rank = new Map<string, number>()
  const refreshRanks = (column: string[]) => column.forEach((id, index) => rank.set(id, (index + 0.5) / column.length))
  columns.forEach(refreshRanks)
  const sweep = (order: number[], direction: -1 | 1) => {
    for (const index of order) {
      const column = columns[index]
      const score = new Map<string, number>()
      for (const id of column) {
        const adjacent = neighbors.get(id)!.filter((other) => (layerOf.get(other)! - index) * direction > 0)
        score.set(id, adjacent.length ? adjacent.reduce((sum, other) => sum + rank.get(other)!, 0) / adjacent.length : rank.get(id)!)
      }
      const previous = new Map(column.map((id, i) => [id, i]))
      column.sort((a, b) => score.get(a)! - score.get(b)! || previous.get(a)! - previous.get(b)!)
      refreshRanks(column)
    }
  }
  const indices = columns.map((_, index) => index)
  for (let iteration = 0; iteration < 10; iteration++) {
    sweep(indices.slice(1), -1) // Order against neighbors in the previous columns.
    sweep(indices.slice(0, -1).reverse(), 1) // Order against neighbors in the following columns.
  }
  columns[0].push(...isolated)

  // Position nodes vertically near the average position of their neighbors.
  const gap = (a: string, b: string) => (sizeOf.get(a)! + sizeOf.get(b)!) / 2 + LANE_SEP
  const y = new Map<string, number>()
  columns.forEach((column) => column.forEach((id, i) => y.set(id, i === 0 ? 0 : y.get(column[i - 1])! + gap(column[i - 1], id))))
  const place = (column: string[]) => {
    if (!column.length) return
    const desired = column.map((id) => {
      const adjacent = neighbors.get(id)!
      return adjacent.length ? adjacent.reduce((sum, other) => sum + y.get(other)!, 0) / adjacent.length : y.get(id)!
    })
    const actual = desired.slice()
    for (let i = 1; i < actual.length; i++) actual[i] = Math.max(actual[i], actual[i - 1] + gap(column[i - 1], column[i]))
    const shift = desired.reduce((sum, value, i) => sum + value - actual[i], 0) / column.length
    column.forEach((id, i) => y.set(id, actual[i] + shift))
  }
  for (let iteration = 0; iteration < 10; iteration++) {
    columns.forEach(place)
    columns.slice().reverse().forEach(place)
  }

  let top = Infinity
  let bottom = -Infinity
  for (const id of ids) {
    top = Math.min(top, y.get(id)! - sizeOf.get(id)! / 2)
    bottom = Math.max(bottom, y.get(id)! + sizeOf.get(id)! / 2)
  }
  const offsetY = PAD - top
  const point = (id: string): Point => ({ x: PAD + HALF_W + layerOf.get(id)! * COL_GAP, y: y.get(id)! + offsetY })

  const positions = new Map<string, Point>(kinds.map((kind) => [kind, point(kind)]))
  const routes = new Map<string, Point[]>()
  chains.forEach((chain, key) => routes.set(key, chain.map(point)))
  return {
    positions,
    routes,
    width: PAD * 2 + NODE_W + (layerCount - 1) * COL_GAP,
    height: Math.max(300, bottom + offsetY + PAD),
  }
}
