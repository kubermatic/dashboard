// Copyright 2025 The Kubermatic Kubernetes Platform contributors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// ============================================
// TIME CONSTANTS
// ============================================

const MILLISECONDS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;

export const MILLISECONDS_PER_MINUTE = SECONDS_PER_MINUTE * MILLISECONDS_PER_SECOND;
export const MILLISECONDS_PER_HOUR = MINUTES_PER_HOUR * MILLISECONDS_PER_MINUTE;

// ============================================
// ERROR THROTTLING INTERFACES
// ============================================

export interface ErrorEntry {
  errorKey: string;
  totalOccurrenceCount: number;
  notificationsDisplayedCount: number;
  lastOccurrenceTimestampMs: number;
  nextNotificationTimestampMs: number;
  isAutoMuted: boolean;
  autoMutedTimestampMs?: number;
  lastErrorMessage: string;
  lastHttpStatusCode: number;
  lastFailedUrl: string;
}

export interface ErrorThrottlingConfig {
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  muteThreshold: number;
  muteResetHours: number;
  cleanupIntervalMs: number;
  entryExpirationMs: number;
  enableThrottling: boolean;
  enableAutoMute: boolean;
}

// ============================================
// ERROR THROTTLING CONFIGURATION
// ============================================

const INITIAL_DELAY_HOURS = 2;
const MAX_DELAY_HOURS = 4;
const BACKOFF_MULTIPLIER = 2;
const MUTE_NOTIFICATION_THRESHOLD = 3;
const MUTE_RESET_HOURS = 24;
const CLEANUP_INTERVAL_MINUTES = 10;
const ENTRY_EXPIRATION_HOURS = 24;

export const DEFAULT_THROTTLING_CONFIG: ErrorThrottlingConfig = {
  initialDelayMs: INITIAL_DELAY_HOURS * MILLISECONDS_PER_HOUR,
  maxDelayMs: MAX_DELAY_HOURS * MILLISECONDS_PER_HOUR,
  backoffMultiplier: BACKOFF_MULTIPLIER,
  muteThreshold: MUTE_NOTIFICATION_THRESHOLD,
  muteResetHours: MUTE_RESET_HOURS,
  cleanupIntervalMs: CLEANUP_INTERVAL_MINUTES * MILLISECONDS_PER_MINUTE,
  entryExpirationMs: ENTRY_EXPIRATION_HOURS * MILLISECONDS_PER_HOUR,
  enableThrottling: true,
  enableAutoMute: true,
};
