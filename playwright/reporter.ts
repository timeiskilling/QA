import type {
  FullConfig,
  FullResult,
  Reporter,
  TestCase,
  TestResult,
} from '@playwright/test/reporter';
import { Priority } from './clickUp/priority';
import { Severity } from './clickUp/severity';
import { Status } from './clickUp/status';
import { Tags } from './clickUp/tags';

export interface TestMeta {
  description?: string;
  status?: Status;
  priority?: Priority;
  severity?: Severity;
  tags?: Tags[];
}

type TestOutcome = 'failed' | 'passed';

interface TestReportInfo {
  outcome: TestOutcome;
  title: string;
  file: string;
  error?: string;
  meta: TestMeta;
}

interface ClickUpCustomField {
  id: string;
  value: unknown;
}

interface ClickUpTaskPayload {
  name: string;
  markdown_description: string;
  status?: string;
  priority?: number;
  tags?: string[];
  custom_fields?: ClickUpCustomField[];
}

const DEFAULT_META: TestMeta = {
  description: 'No description provided',
  status: Status.Developming,
  priority: Priority.Medium,
  tags: [Tags.Bug],
};


const DONE_STATUS = 'done';

const PRIORITY_MAP: Record<Priority, number> = {
  [Priority.High]: 2,
  [Priority.Medium]: 3,
  [Priority.Low]: 4,
};

// GET https://api.clickup.com/api/v2/list/{list_id}/field
const SEVERITY_FIELD_ID = process.env['CLICKUP_SEVERITY_FIELD_ID'];
const SEVERITY_OPTION_MAP: Partial<Record<Severity, string>> = {
  [Severity.Minor]: process.env['CLICKUP_SEVERITY_OPTION_MINOR'] ?? '',
  [Severity.Major]: process.env['CLICKUP_SEVERITY_OPTION_MAJOR'] ?? '',
  [Severity.Critical]: process.env['CLICKUP_SEVERITY_OPTION_CRITICAL'] ?? '',
};

const RATE_LIMIT_DELAY_MS = 650; // ~90 requests/min,

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

class ClickUpReporter implements Reporter {
  private reports: TestReportInfo[] = [];
  private reportedTestIds = new Set<string>();
  private listId?: string;
  private apiToken?: string;

  onBegin(_config: FullConfig) {
    this.listId = process.env['LIST_ID'];
    this.apiToken = process.env['CLICK_UP_API_KEY'];

    if (!this.listId || !this.apiToken) {
      console.warn(
        '[ClickUpReporter] LIST_ID or CLICK_UP_API_KEY is not set — tasks will not be created.'
      );
    }
  }

  onTestEnd(test: TestCase, result: TestResult) {
    const hasFailed = result.status === 'failed' || result.status === 'timedOut';
    const hasPassed = result.status === 'passed';

    const isFinalAttempt = result.retry === test.retries;
    if (hasFailed && !isFinalAttempt) return;
    if (!hasFailed && !hasPassed) return;

    if (this.reportedTestIds.has(test.id)) return;
    this.reportedTestIds.add(test.id);

    const metaAnnotation = test.annotations.find(a => a.type === 'clickup-meta');
    let testMeta: TestMeta = { ...DEFAULT_META };

    if (metaAnnotation?.description) {
      try {
        testMeta = { ...testMeta, ...JSON.parse(metaAnnotation.description) };
      } catch (e) {
        console.error(
          `[ClickUpReporter] Failed to parse clickup-meta for "${test.title}":`,
          e
        );
      }
    }

    this.reports.push({
      outcome: hasFailed ? 'failed' : 'passed',
      title: test.title,
      file: test.location.file,
      error: hasFailed ? result.error?.message ?? 'unknown error' : undefined,
      meta: testMeta,
    });
  }

  async onEnd(_result: FullResult) {
    if (!this.listId || !this.apiToken || this.reports.length === 0) return;

    for (const report of this.reports) {
      await this.createTask(report);
      await delay(RATE_LIMIT_DELAY_MS);
    }
  }

  private buildPayload(report: TestReportInfo): ClickUpTaskPayload {
    const { title, file, error, meta, outcome } = report;

    if (outcome === 'passed') {
      return {
        name: `[Auto-Passed] ${title}`,
        markdown_description:
          `### Test passed\n\n` +
          `**Path:** \`${file}\`\n` +
          `**Description:** ${meta.description ?? 'No description provided'}`,
        status: DONE_STATUS,
      };
    }

    const description =
      `### ❌ Automated test failed\n\n` +
      `**Path:** \`${file}\`\n` +
      `**Description:** ${meta.description}\n` +
      `**Severity:** ${meta.severity ?? 'Not specified'}\n\n` +
      `**Error (Log):**\n\`\`\`text\n${error}\n\`\`\``;

    const payload: ClickUpTaskPayload = {
      name: `[Auto-Bug] ${title}`,
      markdown_description: description,
      status: meta.status,
      priority: meta.priority ? PRIORITY_MAP[meta.priority] : PRIORITY_MAP[Priority.Medium],
      tags: meta.tags,
    };

    if (SEVERITY_FIELD_ID && meta.severity) {
      const optionId = SEVERITY_OPTION_MAP[meta.severity];
      if (optionId) {
        payload.custom_fields = [{ id: SEVERITY_FIELD_ID, value: optionId }];
      }
    }

    return payload;
  }

  private async createTask(report: TestReportInfo, attempt = 1): Promise<void> {
    const payload = this.buildPayload(report);

    try {
      const response = await fetch(`https://api.clickup.com/api/v2/list/${this.listId}/task`, {
        method: 'POST',
        headers: {
          Authorization: this.apiToken!,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 429 && attempt <= 3) {
        const retryAfter = Number(response.headers.get('retry-after') ?? 5);
        console.warn(`[ClickUpReporter] Rate limited, retrying in ${retryAfter}s...`);
        await delay(retryAfter * 1000);
        return this.createTask(report, attempt + 1);
      }

      if (!response.ok) {
        const resError = await response.json().catch(() => ({}));
        console.error(
          `[ClickUpReporter] Failed to create task for "${report.title}" (${response.status}):`,
          resError
        );
        return;
      }

      console.log(`✅ [ClickUpReporter] Created ClickUp task for: "${report.title}"`);
    } catch (err) {
      console.error('[ClickUpReporter] Network error while calling ClickUp:', err);
    }
  }
}

export default ClickUpReporter;
