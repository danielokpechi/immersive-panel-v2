import type { EventConfig } from '../config';
// Tidewell Summit 2026 (fictional dev-tools conference). Built entirely in the
// Studio builder, exported from its Publish step, then given a readable id.
import TIDEWELL_SUMMIT from './tidewell-summit.json';

export const TIDEWELL: EventConfig[] = [TIDEWELL_SUMMIT as unknown as EventConfig];
