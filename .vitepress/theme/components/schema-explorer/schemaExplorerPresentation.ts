type PluginPresentation = {
  label?: string
  short?: string
  group?: string
}

const pluginGroupLabels: Record<string, string> = {
  kubernetes: 'Software',
  models: 'Models & inference',
  data: 'Data catalog',
  mcp: 'MCP integrations',
  governance: 'Governance',
}

export const pluginPresentation: Record<string, PluginPresentation> = {
  argocd: { short: 'ARG', group: 'kubernetes' },
  bedrock: { short: 'BED', group: 'models' },
  depl_calls_svc: { label: 'depl-calls-svc', short: 'DCS', group: 'kubernetes' },
  depl_uses_litellm: { label: 'depl-uses-litellm', short: 'DUL', group: 'kubernetes' },
  depl_uses_thalamus: { label: 'depl-uses-thalamus', short: 'DUT', group: 'kubernetes' },
  fluxcd: { short: 'FLX', group: 'kubernetes' },
  github: { short: 'GHB', group: 'kubernetes' },
  litellm: { short: 'LIT', group: 'models' },
  mcp_servers: { label: 'mcp-servers', short: 'MCP', group: 'mcp' },
  mlflow: { short: 'MLF', group: 'models' },
  openai_api_models: { label: 'openai-api-models', short: 'OAI', group: 'models' },
  openmetadata: { short: 'OMD', group: 'data' },
  tech_radar: { label: 'tech-radar', short: 'TCR', group: 'governance' },
  thalamus: { short: 'THA', group: 'models' },
}

export function pluginGroupLabel(group: string) {
  return pluginGroupLabels[group] ?? 'Other plugins'
}

export const FALLBACK_GROUP = 'other'
