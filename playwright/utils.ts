import { test } from '@playwright/test';
import { Priority } from './clickUp/priority';
import { Severity } from './clickUp/severity';
import { Tags } from './clickUp/tags';

export interface TestMeta {
  description?: string;
  status?: string;
  priority?: Priority;
  severity?: Severity;
  tags?: Tags[];
}

export class ClickUpMeta {
  static setDetails(params: TestMeta) {
    test.info().annotations.push({
      type: 'clickup-meta',
      description: JSON.stringify(params),
    });
  }
}
