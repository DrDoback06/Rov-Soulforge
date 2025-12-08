/**
 * Fitness & Activity Types
 */

import type { ActivitySource, ActivityKind } from '../common/shared';

export interface ActivityEvent {
  id: string;
  uid: string;
  source: ActivitySource;
  kind: ActivityKind;
  start: number;
  end: number;
  distanceM?: number;
  steps?: number;
  calories?: number;
  avgHr?: number;
  elevGainM?: number;
  proofs?: {
    gpsQuality: "poor" | "fair" | "good" | "great";
    paceOK: boolean;
    hrOK: boolean;
    cadenceOK?: boolean;
  };
  samplesHash?: string;
}
