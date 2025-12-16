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
  logThrottledErrors: boolean;
}

// ============================================
// ERROR THROTTLING CONFIGURATION
// ============================================

// export const DEFAULT_THROTTLING_CONFIG: ErrorThrottlingConfig = {
//   initialDelayMs: 10 * MILLISECONDS_PER_SECOND, // 10 seconds - Initial delay before showing next notification
//   maxDelayMs: 20 * MILLISECONDS_PER_SECOND, // 20 seconds - Maximum delay cap for exponential backoff
//   backoffMultiplier: 2, // Multiplier for exponential backoff (e.g., 2 = double delay each time)
//   muteThreshold: 3, // Mute after 3 notifications - Number of notifications before auto-muting an error
//   muteResetHours: 0.033, // ~2 minutes - Hours after muting before resetting error tracking
//   cleanupIntervalMs: 5 * MILLISECONDS_PER_SECOND, // 5 seconds - Interval for cleaning up expired entries
//   entryExpirationMs: 1 * MILLISECONDS_PER_MINUTE, // 1 minute - Time after which inactive entries are removed
//   enableThrottling: true, // Enable/disable throttling (if false, show all errors)
//   enableAutoMute: true, // Enable/disable auto-muting after threshold
//   logThrottledErrors: true, // Enable/disable console logging for debugging
// };

export const DEFAULT_THROTTLING_CONFIG: ErrorThrottlingConfig = {
  initialDelayMs: 2 * MILLISECONDS_PER_HOUR, // 2 hours - Initial delay before showing next notification
  maxDelayMs: 4 * MILLISECONDS_PER_HOUR, // 4 hours - Maximum delay cap for exponential backoff
  backoffMultiplier: 2, // Multiplier for exponential backoff (e.g., 2 = double delay each time)
  muteThreshold: 3, // Mute after 3 notifications - Number of notifications before auto-muting an error
  muteResetHours: 24, // 24 hours - Hours after muting before resetting error tracking
  cleanupIntervalMs: 10 * MILLISECONDS_PER_MINUTE, // 10 minutes - Interval for cleaning up expired entries
  entryExpirationMs: 24 * MILLISECONDS_PER_HOUR, // 24 hours - Time after which inactive entries are removed
  enableThrottling: true, // Enable/disable throttling (if false, show all errors)
  enableAutoMute: true, // Enable/disable auto-muting after threshold
  logThrottledErrors: false, // Disable console logging in production
};
