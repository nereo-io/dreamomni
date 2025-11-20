/**
 * Agent API Client - 与 python-agent 后端通信
 * Phase 4: 简单封装，直接转发请求
 */

const AGENT_API_URL = process.env.PYTHON_AGENT_URL || 'http://localhost:8000';
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || '';

interface AgentRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
}

/**
 * 统一的 Agent API 请求方法
 */
export async function agentRequest(
  endpoint: string,
  options: AgentRequestOptions = {}
) {
  const { method = 'GET', body, headers = {} } = options;

  const url = `${AGENT_API_URL}${endpoint}`;

  const fetchOptions: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${INTERNAL_API_KEY}`,
      ...headers,
    },
  };

  if (body) {
    fetchOptions.body = JSON.stringify(body);
  }

  const response = await fetch(url, fetchOptions);

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Agent API error: ${response.status} ${error}`);
  }

  // 204 No Content 不返回 JSON
  if (response.status === 204) {
    return null;
  }

  return response.json();
}

/**
 * 获取任务详情
 */
export async function getAgentJob(jobId: string, includeShots = false) {
  return agentRequest(`/v1/jobs/${jobId}?include_shots=${includeShots}`);
}

/**
 * 获取任务资产
 */
export async function getAgentJobAssets(
  jobId: string,
  assetType?: string,
  limit = 50,
  offset = 0
) {
  let endpoint = `/v1/jobs/${jobId}/assets?limit=${limit}&offset=${offset}`;
  if (assetType) {
    endpoint += `&asset_type=${assetType}`;
  }
  return agentRequest(endpoint);
}

/**
 * 获取任务列表
 */
export async function getAgentJobs(
  userId: string,
  page = 1,
  pageSize = 20,
  includeShots = false
) {
  return agentRequest(`/v1/jobs?user_id=${userId}&page=${page}&page_size=${pageSize}&include_shots=${includeShots}`);
}

/**
 * 删除任务
 */
export async function deleteAgentJob(jobId: string) {
  return agentRequest(`/v1/jobs/${jobId}`, { method: 'DELETE' });
}

/**
 * 重试任务
 */
export async function retryAgentJob(jobId: string) {
  return agentRequest(`/v1/jobs/${jobId}/retry`, { method: 'POST' });
}

/**
 * 创建 Agent 任务
 */
export async function createAgentJob(data: {
  user_id: string;
  prompt: string;
  reference_image_url?: string;
  reference_image_urls?: string[];
  duration_seconds: number;
  image_model?: string;
  video_model?: string;
}) {
  return agentRequest('/v1/jobs', {
    method: 'POST',
    body: data,
  });
}
