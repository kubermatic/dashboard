// Copyright 2022 The Kubermatic Kubernetes Platform contributors.
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

export const sidenavCollapsibleWidth = 1500;
export const quotaWidgetCollapsibleWidth = 1200;

export const ANEXIA_DEPRECATED_MESSAGE =
  'Anexia has been deprecated in KKP 2.30 and is planned to be removed. Please plan your migration to a supported provider to ensure continued service.';

export const KUBERNETES_DASHBOARD_DEPRECATED_MESSAGE =
  'Kubernetes Dashboard is no longer maintained. This feature is deprecated and may be removed in a future release.';

export const OPA_DEPRECATED_MESSAGE =
  'OPA (Open Policy Agent) has been deprecated in KKP 2.28 and will be removed in a future release. Kyverno has replaced it as an Enterprise Edition feature for policy management.';

export const BACKUP_DURATION_ERROR_MESSAGE =
  'Duration must use hours, minutes and/or seconds in that order, with minutes and seconds below 60 ' +
  'after a larger unit (e.g., 168h, 24h10m10s or 2m10s).';
export const BACKUP_EXPIRES_IN_HINT =
  'Duration in hours, minutes and seconds (e.g., 168h or 24h10m10s). ' +
  'The amount of time before this backup is eligible for garbage collection. If not specified, ' +
  'a default value of 30 days will be used.';
export const BACKUP_SYNC_PERIOD_HINT =
  'Duration in hours, minutes and seconds (e.g., 1h or 2m10s). ' +
  'Defines how frequently to sync backup API objects from object storage. A value of 0 disables sync.';
