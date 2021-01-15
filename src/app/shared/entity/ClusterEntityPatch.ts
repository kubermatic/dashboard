// Patch object definitions for ClusterEntity.
// Please note that these objects do not have to contain all the fields of equivalent classes.

import {AuditLoggingSettings} from './ClusterEntity';

export class ClusterEntityPatch {
  id?: string;
  name?: string;
  labels?: object;
  spec?: ClusterSpecPatch;
}

export class ClusterSpecPatch {
  cloud?: CloudSpecPatch;
  version?: string;
  usePodSecurityPolicyAdmissionPlugin?: boolean;
  usePodNodeSelectorAdmissionPlugin?: boolean;
  podNodeSelectorAdmissionPluginConfig?: object;
  auditLogging?: AuditLoggingSettings;
  openshift?: OpenShiftPatch;
}

export class OpenShiftPatch {
  imagePullSecret?: string;
}

export class CloudSpecPatch {
  digitalocean?: DigitaloceanCloudSpecPatch;
  aws?: AWSCloudSpecPatch;
  openstack?: OpenstackCloudSpecPatch;
  packet?: PacketCloudSpecPatch;
  vsphere?: VSphereCloudSpecPatch;
  hetzner?: HetznerCloudSpecPatch;
  azure?: AzureCloudSpecPatch;
  gcp?: GCPCloudSpecPatch;
  kubevirt?: KubevirtCloudSpecPatch;
  alibaba?: AlibabaCloudSpecPatch;
}

export class DigitaloceanCloudSpecPatch {
  token?: string;
}

export class GCPCloudSpecPatch {
  serviceAccount?: string;
}

export class OpenstackCloudSpecPatch {
  username?: string;
  password?: string;
}

export class PacketCloudSpecPatch {
  apiKey?: string;
  projectID?: string;
  billingCycle?: string;
}

export class HetznerCloudSpecPatch {
  token?: string;
}

export class AWSCloudSpecPatch {
  accessKeyId?: string;
  secretAccessKey?: string;
}

export class AzureCloudSpecPatch {
  clientID?: string;
  clientSecret?: string;
  subscriptionID?: string;
  tenantID?: string;
}

export class VSphereCloudSpecPatch {
  username?: string;
  password?: string;
  infraManagementUser?: VSphereInfraManagementUser;
}

export class VSphereInfraManagementUser {
  username?: string;
  password?: string;
}

export class KubevirtCloudSpecPatch {
  kubeconfig?: string;
}

export class AlibabaCloudSpecPatch {
  accessKeyID?: string;
  accessKeySecret?: string;
}
