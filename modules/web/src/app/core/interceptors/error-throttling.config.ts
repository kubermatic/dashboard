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

export const MILLISECONDS_PER_SECOND = 1000;
export const SECONDS_PER_MINUTE = 60;
export const MINUTES_PER_HOUR = 60;
export const MILLISECONDS_PER_MINUTE = MILLISECONDS_PER_SECOND * SECONDS_PER_MINUTE;
export const MILLISECONDS_PER_HOUR = MILLISECONDS_PER_MINUTE * MINUTES_PER_HOUR;

// ============================================
// ERROR THROTTLING INTERFACES
// ============================================

export interface ErrorTrackingEntry {
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
  /** Initial delay before showing next notification (ms) */
  initialDelayMs: number;
  /** Maximum delay cap for exponential backoff (ms) */
  maxDelayMs: number;
  /** Multiplier for exponential backoff (e.g., 2 = double delay each time) */
  backoffMultiplier: number;
  /** Number of notifications before auto-muting an error */
  muteThreshold: number;
  /** Hours after muting before resetting error tracking */
  muteResetHours: number;
  /** Interval for cleaning up expired entries (ms) */
  cleanupIntervalMs: number;
  /** Time after which inactive entries are removed (ms) */
  entryExpirationMs: number;
  /** Enable/disable throttling (if false, show all errors) */
  enableThrottling: boolean;
  /** Enable/disable auto-muting after threshold */
  enableAutoMute: boolean;
  /** Enable/disable console logging for debugging */
  logThrottledErrors: boolean;
}

// ============================================
// ERROR THROTTLING CONFIGURATION
// ============================================

export const DEFAULT_THROTTLING_CONFIG: ErrorThrottlingConfig = {
  initialDelayMs: 10 * MILLISECONDS_PER_SECOND, // 10 seconds
  maxDelayMs: 20 * MILLISECONDS_PER_SECOND, // 20 seconds
  backoffMultiplier: 2,
  muteThreshold: 3, // Mute after 3 notifications
  muteResetHours: 0.033, // ~2 minutes
  cleanupIntervalMs: 5 * MILLISECONDS_PER_SECOND, // 5 seconds
  entryExpirationMs: 1 * MILLISECONDS_PER_MINUTE, // 1 minute
  enableThrottling: true,
  enableAutoMute: true,
  logThrottledErrors: true,
};