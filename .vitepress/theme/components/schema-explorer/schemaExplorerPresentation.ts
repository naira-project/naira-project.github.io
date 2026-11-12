type PluginPresentation = {
  short?: string;
  group?: string;
};

const pluginGroupLabels: Record<string, string> = {
  software: "Software",
  models: "Models & inference",
  data: "Data catalog",
  mcp: "MCP integrations",
  governance: "Governance",
};

export const pluginPresentation: Record<string, PluginPresentation> = {
  argocd: { short: "ARG", group: "software" },
  bedrock: { short: "BED", group: "models" },
  depl_calls_svc: { short: "DCS", group: "software" },
  depl_uses_litellm: { short: "DUL", group: "software" },
  depl_uses_thalamus: { short: "DUT", group: "software" },
  fluxcd: { short: "FLX", group: "software" },
  github: { short: "GHB", group: "software" },
  litellm: { short: "LIT", group: "models" },
  mcp_servers: { short: "MCP", group: "mcp" },
  mlflow: { short: "MLF", group: "models" },
  openai_api_models: { short: "OAI", group: "models" },
  openmetadata: { short: "OMD", group: "data" },
  tech_radar: { short: "TCR", group: "governance" },
  thalamus: { short: "THA", group: "models" },
};

export function pluginGroupLabel(group: string) {
  return pluginGroupLabels[group] ?? "Other plugins";
}

export const FALLBACK_GROUP = "other";
