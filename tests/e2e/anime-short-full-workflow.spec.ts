import { test, expect, type Page } from '@playwright/test';

const DEFAULT_MAX_WAIT_MINUTES = 35;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getMaxWaitMs() {
  const raw = process.env.E2E_MAX_WAIT_MINUTES;
  const minutes = raw ? Number(raw) : DEFAULT_MAX_WAIT_MINUTES;
  if (!Number.isFinite(minutes) || minutes <= 0) {
    return DEFAULT_MAX_WAIT_MINUTES * 60_000;
  }
  return Math.floor(minutes * 60_000);
}

async function getLeftCredits(page: Page) {
  const res = await page.request.get('/api/credits');
  expect(res.ok()).toBeTruthy();

  const json = await res.json();
  if (!json || json.code !== 0) {
    throw new Error(`Unexpected /api/credits response: ${JSON.stringify(json)}`);
  }

  const credits = Number(json?.data?.credits);
  if (!Number.isFinite(credits)) {
    throw new Error(`Unexpected credits payload: ${JSON.stringify(json)}`);
  }

  return credits;
}

function getVideoModelLabel(modelId: string) {
  if (modelId === 'kie-veo3-image-to-video') return 'Veo3';
  if (modelId === 'byteplus-seedance-1-5-pro-image-to-video') return 'Seedance Pro';
  return modelId;
}

test.describe('Anime short agent (real credits)', () => {
  test.skip(process.env.E2E_REAL_RUN !== 'true', 'Set E2E_REAL_RUN=true to run real workflow.');

  test('creates job and waits for final video', async ({ page }) => {
    const maxWaitMs = getMaxWaitMs();
    test.setTimeout(maxWaitMs + 5 * 60_000);

    const keyframesEnabled = process.env.E2E_KEYFRAMES_ENABLED !== 'false';
    const selectedVideoModel = process.env.E2E_VIDEO_MODEL || 'kie-veo3-image-to-video';
    const selectedAspectRatio = process.env.E2E_ASPECT_RATIO || '16:9';

    const locale = process.env.E2E_LOCALE || 'en';
    await page.goto(`/${locale}/ai-shorts`, { waitUntil: 'networkidle' });

    await expect(page.getByRole('heading', { name: 'Create Agent Job' })).toBeVisible({
      timeout: 60_000,
    });

    const now = new Date();
    const prompt = [
      'Generate a 60-second anime short film.',
      'Keep the main character consistent across shots.',
      `E2E run at ${now.toISOString()}.`,
      'Story: a shy barista finds courage to help a lost child in the rain, warm ending.',
    ].join('\n');

    const creditsBefore = await getLeftCredits(page);
    console.log(`💳 Credits before: ${creditsBefore}`);

    await page.getByPlaceholder(/Describe your video concept/i).fill(prompt);

    // Aspect ratio
    if (selectedAspectRatio) {
      const aspectLabel = page.getByText('Aspect Ratio', { exact: true }).locator('..');
      const aspectSelect = aspectLabel.getByRole('combobox').first();
      await aspectSelect.scrollIntoViewIfNeeded();
      await aspectSelect.click({ timeout: 30_000 });
      await page
        .getByRole('option', { name: selectedAspectRatio, exact: true })
        .click({ timeout: 30_000 });
    }

    // Use real credits but keep it time-efficient:
    // - Duration defaults to 60s
    // - Aspect ratio defaults to 16:9
    // - Keyframes can be disabled for speed
    // - Set video model via env: E2E_VIDEO_MODEL=kie-veo3-image-to-video|byteplus-seedance-1-5-pro-image-to-video
    const videoModelLabel = getVideoModelLabel(selectedVideoModel);
    const videoModelSection = page.getByText('Video Model', { exact: true }).locator('..');
    const videoModelCombobox = videoModelSection.getByRole('combobox').first();
    await videoModelCombobox.scrollIntoViewIfNeeded();
    await videoModelCombobox.click({ timeout: 30_000 });
    await page
      .getByRole('option', { name: videoModelLabel, exact: true })
      .click({ timeout: 30_000 });

    if (!keyframesEnabled) {
      const keyframesLabel = page.getByText('Generate Keyframes', { exact: true });
      await keyframesLabel.scrollIntoViewIfNeeded();
      await page.getByRole('switch').first().click();
    }

    const createResponsePromise = page.waitForResponse((resp) => {
      const req = resp.request();
      return req.method() === 'POST' && resp.url().endsWith('/api/agent/jobs');
    });

    await page.getByRole('button', { name: 'Generate' }).click();

    const createResp = await createResponsePromise;
    expect(createResp.ok()).toBeTruthy();

    const createdJob = await createResp.json();
    const jobId: string | undefined = createdJob?.id || createdJob?.job_id;
    expect(jobId, `Unexpected create job response: ${JSON.stringify(createdJob)}`).toBeTruthy();

    console.log(`🧪 Created agent job: ${jobId}`);

    const deadline = Date.now() + maxWaitMs;
    let lastStatus: string | null = null;
    let lastStep: string | null = null;

    while (Date.now() < deadline) {
      const res = await page.request.get(`/api/agent/jobs/${jobId}?include_shots=true`);
      expect(res.ok()).toBeTruthy();
      const job = await res.json();

      const status: string | null = job?.status ?? null;
      const step: string | null = job?.current_step ?? null;

      if (status !== lastStatus || step !== lastStep) {
        console.log(`⏳ Job ${jobId} status=${status} step=${step}`);
        lastStatus = status;
        lastStep = step;
      }

      if (status === 'failed') {
        throw new Error(`Job failed: ${job?.error_message || 'Unknown error'}`);
      }

      if (status === 'completed') {
        expect(job.final_video_url).toBeTruthy();
        expect(String(job.final_video_url)).toMatch(/^https?:\/\//);

        expect(job.keyframes_enabled).toBe(keyframesEnabled);
        expect(job.aspect_ratio).toBe(selectedAspectRatio);

        expect(Array.isArray(job.shots)).toBeTruthy();
        expect(job.shots.length).toBeGreaterThan(0);

        const successfulVideos = job.shots.filter((s: any) => s?.video_status === 'done' && s?.video_url);
        expect(successfulVideos.length).toBeGreaterThan(0);

        const anyAttempts = job.shots.some((s: any) => Array.isArray(s?.attempts) && s.attempts.length > 0);
        expect(anyAttempts).toBe(true);

        const anyKeyframeAttempts = job.shots.some((s: any) => {
          return Array.isArray(s?.keyframe_attempts) && s.keyframe_attempts.length > 0;
        });
        if (keyframesEnabled) {
          expect(anyKeyframeAttempts).toBe(true);
        }

        const creditsAfter = await getLeftCredits(page);
        console.log(`💳 Credits after: ${creditsAfter}`);

        const creditsCharged = Number(job.credits_charged);
        expect(Number.isFinite(creditsCharged)).toBe(true);

        const delta = creditsBefore - creditsAfter;
        console.log(`🧾 credits_charged=${creditsCharged} delta=${delta}`);
        expect(delta).toBeGreaterThan(0);
        expect(Math.abs(delta - creditsCharged)).toBeLessThanOrEqual(1);

        console.log(`✅ Job completed: ${jobId}`);
        console.log(`🎞️ Final video: ${job.final_video_url}`);
        return;
      }

      await sleep(10_000);
    }

    throw new Error(`Timeout waiting for job completion after ${Math.round(maxWaitMs / 60_000)} minutes`);
  });
});
