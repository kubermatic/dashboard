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

// Deprecation & EOL messages
export const ANEXIA_DEPRECATED_MESSAGE =
  'Anexia has been deprecated in KKP 2.30 and is planned to be removed. Please plan your migration to a supported provider to ensure continued service.';

export const KUBERNETES_DASHBOARD_DEPRECATED_MESSAGE =
  'Kubernetes Dashboard is no longer maintained. This feature is deprecated and may be removed in a future release.';

export const OPA_DEPRECATED_MESSAGE =
  'OPA (Open Policy Agent) has been deprecated in KKP 2.28 and will be removed in a future release. Kyverno has replaced it as an Enterprise Edition feature for policy management.';

export const CONTAINER_LINUX_EOL_TOOLTIP =
  'Container Linux has reached its end of life and is no longer maintained or updated.';

// Machine deployment tooltips
export const MACHINE_AVAILABILITY_TOOLTIP =
  'Number of available machines may be higher than number of desired machines from the template if deployment is updating.';

export const MACHINE_COUNT_TOOLTIP = 'Number of running machines/Number of desired machines.';

// Policy tooltips
export const DEFAULT_POLICY_TOOLTIP =
  'Default policies are automatically applied to new clusters. Users can delete them afterwards.';

export const ENFORCED_POLICY_TOOLTIP =
  "Enforced policies will be applied to all targeted clusters. Users can't delete them.";

// Common action tooltips
export const CLICK_TO_COPY_TOOLTIP = 'Click to copy';
export const GENERATE_NAME_TOOLTIP = 'Generate name';
export const DELETE_SELECTED_TOOLTIP = 'Delete selected';
export const CLOSE_PANEL_TOOLTIP = 'Close panel';
export const GO_BACK_TO_CLUSTER_LIST_TOOLTIP = 'Go back to the cluster list';
