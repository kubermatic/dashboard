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

export const DEFAULT_DEBOUNCE_TIME_MS = 500;

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

// Permission tooltip
export const DISABLED_TOOLTIP_MESSAGE =
  'You do not have permission to perform this action. Contact the project owner to change your membership role.';

// Common action tooltips
export const CLICK_TO_COPY_TOOLTIP = 'Click to copy';
export const GENERATE_NAME_TOOLTIP = 'Generate name';
export const DELETE_SELECTED_TOOLTIP = 'Delete selected';
export const CLOSE_PANEL_TOOLTIP = 'Close panel';
export const GO_BACK_TO_CLUSTER_LIST_TOOLTIP = 'Go back to the cluster list';

// Cluster option tooltips
// Shared by the cluster wizard and the edit cluster dialog so both describe an option the same way.
// Each entry says what the option actually does; when an admin locks the option, one of the notes
// below is prefixed so the reason the control is disabled is the first thing the user reads.
export const ADMIN_ENFORCED_NOTE = 'Enforced by your admin and cannot be changed.';
export const ADMIN_ENFORCED_IN_DATACENTER_NOTE =
  'Enforced by your admin in the chosen datacenter and cannot be changed.';
export const ADMIN_DISABLED_IN_DATACENTER_NOTE =
  'Disabled by your admin in the chosen datacenter and cannot be changed.';

export const CLUSTER_OPTION_TOOLTIPS = {
  containerRuntime: 'Containerd is the only supported container runtime',
  dualStack:
    'Dual Stack is a technology preview feature, some limitations may apply depending on the chosen provider. Please see the KKP documentation for more details.',
  podSecurityPolicy: 'Pod Security Policies allow detailed authorization of pod creation and updates.',
  konnectivity: 'OpenVPN support is deprecated, hence Konnectivity can no longer be disabled.',
  ciliumIngress: 'Enable Cilium kubernetes ingress support',

  auditLogging:
    'Records requests received by the Kubernetes API of this cluster. Logs are collected by a fluent-bit sidecar in the control plane.',
  auditPolicyCustom:
    'Sets up cluster with a metadata audit policy that can be edited after the cluster has been created.',
  auditPolicyMetadata: 'Logs metadata for all requests received by the Kubernetes API.',
  auditPolicyMinimal:
    'Logs extended information about key security concerns like workload modifications and access to sensitive information.',
  auditPolicyRecommended:
    'Logs extended information about key security concerns and metadata for all other requests. Recommended for best security coverage.',
  auditWebhookBackend: 'Ships audit logs to an external webhook backend, configured from a secret in this cluster.',

  opaEnforced: 'OPA Integration is enforced by your admin.',
  opaDisabled: 'OPA Integration is disabled by your admin.',
  kyverno:
    'Deploys Kyverno for policy management. Its controllers run in the cluster control plane and register admission webhooks that validate and mutate resources in this user cluster.',

  mlaLogging: 'Collects logs from all pods in this user cluster and ships them to the central Grafana Loki store.',
  mlaMonitoring:
    'Scrapes metrics from this user cluster and writes them to the central metrics store for viewing in Grafana.',

  kubeLB:
    'Enable to use Kubermatic KubeLB for managing load balancers in your cluster. This allows automatic provisioning and management of load balancers for your services.',
  kubeLBEnforced: 'Kubermatic KubeLB is enforced by your admin in the chosen datacenter and cannot be disabled.',
  kubeLBLoadBalancerClass:
    'Enable to limit KubeLB to only process services with Kubernetes LoadBalancer Class named `kubelb`. When disabled, KubeLB will manage all services of type `LoadBalancer`',
  gatewayAPI: 'Enable to use Gateway APIs. KKP will install the Gateway API CRDs in this cluster.',

  disableCSIDriver:
    "Skips installation of the provider's default CSI driver, leaving the cluster without dynamic volume provisioning or snapshots. It cannot be turned on while existing volumes still use the driver.",
  csiDriverDisabledByAdmin: 'The CSI driver is disabled by your admin in the chosen datacenter and cannot be enabled.',

  encryptionAtRest:
    'Encrypts Kubernetes secrets at rest in etcd with a secretbox key. Enabling it or changing the key runs a job that re-encrypts all affected resources.',
  generateEncryptionKey: 'Generate encryption key',

  clusterBackup:
    'Installs Velero in this cluster so cluster resources and volume data can be backed up to the selected backup storage location.',
  userSSHKeyAgent:
    'Enable to deploy User SSH Key Agent to the cluster. It cannot be changed once the cluster is created.',
} as const;

// Backup storage location validation messages
export const REGION_ERROR_MESSAGE = 'Region must be a valid DNS name.';
export const ENDPOINT_URL_ERROR_MESSAGE =
  'Endpoint URL must start with http:// or https:// and contain a valid DNS host.';

// Per-cluster proxy tooltips
export const PROXY_MODE_HINT = 'kube-proxy mode for in-cluster service routing.';
export const NODE_EGRESS_PROXY_TOOLTIP =
  'Sets the HTTP_PROXY, HTTPS_PROXY and NO_PROXY environment variables on worker nodes. ' +
  'Used for node egress such as container image pulls and package downloads; does not affect ' +
  'control-plane traffic to the cloud provider. Leave empty to inherit the datacenter/seed proxy.';
