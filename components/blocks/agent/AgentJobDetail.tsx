"use client";

import { useEffect, useState, useMemo } from "react";
import type { AgentJob } from "@/types/agent";

interface AgentJobDetailProps {
  jobId: string;
  locale: string;
}

export function AgentJobDetail({ jobId }: AgentJobDetailProps) {
  const [job, setJob] = useState<AgentJob | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchJob() {
      try {
        setIsLoading(true);
        setError(null);

        const res = await fetch(`/api/agent/jobs/${jobId}?include_shots=true`, {
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error(`Failed to fetch job: ${res.statusText}`);
        }

        const data = await res.json();
        if (!cancelled) {
          setJob(data as AgentJob);
        }
      } catch (err: any) {
        if (!cancelled) {
          console.error("[AgentJobDetail] fetch error:", err);
          setError(err.message || "Failed to load job");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchJob();

    const interval = setInterval(fetchJob, 5000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [jobId]);

  const qualityLogs = useMemo(() => {
    if (!job?.logs) return [];
    return job.logs.filter((entry) =>
      typeof entry.message === "string" && entry.message.includes("质量")
    );
  }, [job]);

  const allLogs = useMemo(() => {
    if (!job?.logs) return [];
    return job.logs;
  }, [job]);

  if (isLoading && !job) {
    return (
      <div className="p-6 text-gray-300">
        Loading Agent job details...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-red-400 text-sm">
        Failed to load job: {error}
      </div>
    );
  }

  if (!job) {
    return (
      <div className="p-6 text-gray-400 text-sm">
        Job not found or no data available.
      </div>
    );
  }

  const storyboardJson = job.storyboard_json as any;
  const outline = (storyboardJson?.story_outline || (job.story_outline as any) || {}) as any;
  const acts = Array.isArray(outline?.acts) ? outline.acts : [];
  const theme = outline?.theme;
  const tone = outline?.tone;
  const logline = outline?.logline;
  const conflict = outline?.conflict;
  const ending = outline?.ending;
  const soundBed = outline?.sound_bed;

  const storyboardRoot =
    storyboardJson && typeof storyboardJson === "object"
      ? (storyboardJson as any).storyboard || storyboardJson
      : null;
  const keyElements = Array.isArray(storyboardRoot?.key_elements)
    ? storyboardRoot.key_elements
    : [];
  const characterElements = keyElements.filter(
    (element: any) => element && element.type === "character"
  );
  const sceneElement =
    keyElements.find((element: any) => element && element.type === "scene") || null;

  const referenceImages =
    job.character_reference_images && job.character_reference_images.length > 0
      ? job.character_reference_images
      : job.reference_image_urls && job.reference_image_urls.length > 0
      ? job.reference_image_urls
      : [];

  return (
    <div className="p-6 space-y-6 text-gray-100">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold mb-2">Agent Job Details</h1>
        <p className="text-sm text-gray-400 break-words">
          {job.prompt}
        </p>
      </div>

      {/* Story Outline */}
      <section className="bg-gray-900/60 rounded-lg border border-gray-800 p-4 space-y-3">
        <h2 className="text-lg font-semibold">故事梗概 Story Outline</h2>
        {(logline || conflict || ending || soundBed || theme || tone || acts.length > 0) ? (
          <div className="space-y-3 text-sm text-gray-300">
            {(logline || conflict || ending || soundBed) && (
              <div className="space-y-2">
                {logline && (
                  <div>
                    <span className="text-gray-400">Logline:</span>{" "}
                    <span>{logline}</span>
                  </div>
                )}
                {conflict && (
                  <div>
                    <span className="text-gray-400">Conflict:</span>{" "}
                    <span>{conflict}</span>
                  </div>
                )}
                {ending && (
                  <div>
                    <span className="text-gray-400">Ending:</span>{" "}
                    <span>{ending}</span>
                  </div>
                )}
                {soundBed && (
                  <div>
                    <span className="text-gray-400">Sound bed:</span>{" "}
                    <span>{soundBed}</span>
                  </div>
                )}
              </div>
            )}
            {(theme || tone) && (
              <div className="space-x-3">
                {theme && <span>主题: {theme}</span>}
                {tone && <span>基调: {tone}</span>}
              </div>
            )}
            {acts.length > 0 && (
              <ol className="space-y-2 text-gray-200 list-decimal list-inside">
                {acts.map((act: any, index: number) => (
                  <li key={act.id || index}>
                    <span className="font-medium">
                      {act.title || `Act ${index + 1}`}:
                    </span>{" "}
                    <span className="text-gray-300">
                      {act.summary || act.description || ""}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-400">
            当前任务尚未生成结构化的故事梗概,请稍后重试。
          </p>
        )}
      </section>

      {/* Scene */}
      <section className="bg-gray-900/60 rounded-lg border border-gray-800 p-4 space-y-3">
        <h2 className="text-lg font-semibold">场景设定 Scene</h2>
        {sceneElement ? (
          <div className="text-sm text-gray-300 space-y-1">
            <div className="font-medium">
              {sceneElement.id || "Scene"}
            </div>
            {sceneElement.description && (
              <p className="text-gray-400">{sceneElement.description}</p>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-400">
            当前任务尚未生成场景设定,请稍后重试。
          </p>
        )}
      </section>

      {/* Main Characters */}
      <section className="bg-gray-900/60 rounded-lg border border-gray-800 p-4 space-y-3">
        <h2 className="text-lg font-semibold">主角角色 Main Characters</h2>
        {characterElements.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {characterElements.map((char: any, index) => {
              const imageUrl = referenceImages[index] || referenceImages[0];

              return (
                <div
                  key={char.id || index}
                  className="flex gap-3 items-start bg-gray-950/40 rounded-md p-3"
                >
                  {imageUrl && (
                    <img
                      src={imageUrl}
                      alt={char.id || "character"}
                      className="w-14 h-14 rounded-md object-cover flex-shrink-0 border border-gray-800"
                    />
                  )}
                  <div className="space-y-1">
                    <div className="text-sm font-semibold">
                      {char.id || `Character ${index + 1}`}
                    </div>
                    {char.description && (
                      <p className="text-xs text-gray-400 mt-1">
                        {char.description}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-400">
            当前任务尚未生成主角设定,请稍后重试。
          </p>
        )}
      </section>

      {/* Quality Logs & Summary */}
      <section className="bg-gray-900/60 rounded-lg border border-gray-800 p-4 space-y-3">
        <h2 className="text-lg font-semibold">质量检查 Quality</h2>

        {job.global_quality && (
          <div className="text-sm text-gray-300 space-x-3">
            <span>
              镜头:{" "}
              {(job.global_quality as any).successful_shots ?? 0}/
              {(job.global_quality as any).total_shots ?? job.num_shots}
            </span>
            {typeof (job.global_quality as any).quality_ok === "boolean" && (
              <span>
                结果:{" "}
                {(job.global_quality as any).quality_ok ? "通过" : "存在异常"}
              </span>
            )}
          </div>
        )}

        {qualityLogs.length > 0 ? (
          <div className="mt-2 space-y-1 max-h-40 overflow-y-auto text-sm text-gray-300 bg-black/20 rounded-md p-2">
            {qualityLogs.map((log) => (
              <div key={log.timestamp} className="flex gap-2">
                <span className="text-gray-500">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
                <span className="whitespace-pre-wrap break-words">{log.message}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">
            暂未记录质量检查相关日志,可能任务仍在执行中。
          </p>
        )}
      </section>

      {/* Full Agent Logs */}
      {allLogs.length > 0 && (
        <section className="bg-gray-900/60 rounded-lg border border-gray-800 p-4 space-y-3">
          <h2 className="text-lg font-semibold">执行日志 Agent Logs</h2>
          <div className="mt-1 space-y-1 max-h-96 overflow-y-auto text-sm text-gray-300 bg-black/20 rounded-md p-2">
            <div className="text-xs text-gray-500 font-mono break-all">
              Agent ID: {job.id}
            </div>
            {allLogs.map((log) => (
              <div key={log.timestamp} className="flex gap-2">
                <span className="text-gray-500">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
                <span className="whitespace-pre-wrap break-words">{log.message}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
