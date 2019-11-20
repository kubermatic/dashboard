import {CustomLink} from '../utils/custom-link-utils/custom-link';

export class AdminSettings {
  cleanupOptions: CleanupOptions;
  clusterTypeOptions: ClusterTypeOptions;
  customLinks: CustomLink[];
  defaultNodeCount: number;
  displayAPIDocs: boolean;
  displayDemoInfo: boolean;
  displayTermsOfService: boolean;
}

export class CleanupOptions {
  Enabled: boolean;
  Enforced: boolean;
}

export enum ClusterTypeOptions {
  All = 0,
  Kubernetes = 1,
  OpenShift = 2,
}

export class AdminEntity {
  name?: string;
  email?: string;
  isAdmin?: boolean;
}
