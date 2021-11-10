// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
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

export class EtcdBackupConfig {
  // ObjectMeta
  creationTimestamp?: Date;
  deletionTimestamp?: Date;
  id?: string;
  name: string;

  // Spec
  spec: EtcdBackupConfigSpec;

  // Status
  status: EtcdBackupConfigStatus;
}

export class EtcdBackupConfigSpec {
  // Cluster is the id of the cluster which will be backed up
  clusterId: string;
  // Schedule is a cron expression defining when to perform
  // the backup. If not set, the backup is performed exactly
  // once, immediately.
  schedule?: string;
  // Keep is the number of backups to keep around before deleting the oldest one
  // If not set, defaults to DefaultKeptBackupsCount. Only used if Schedule is set.
  keep?: number;
}

export class EtcdBackupConfigStatus {
  // CurrentBackups tracks the creation and deletion progress if all backups managed by the EtcdBackupConfig
  lastBackups?: BackupStatus[];
  // Conditions contains conditions of the EtcdBackupConfig
  conditions?: EtcdBackupConfigCondition[];
  // If the controller was configured with a cleanupContainer, CleanupRunning keeps track of the corresponding job
  cleanupRunning?: boolean;
}

export class BackupStatus {
  // ScheduledTime will always be set when the BackupStatus is created, so it'll never be nil
  scheduledTime?: Date;
  backupName?: string;
  jobName?: string;
  backupStartTime?: Date;
  backupFinishedTime?: Date;
  backupPhase?: BackupStatusPhase;
  backupMessage?: string;
  deleteJobName?: string;
  deleteStartTime?: Date;
  deleteFinishedTime?: Date;
  deletePhase?: BackupStatusPhase;
  deleteMessage?: string;
}

export class EtcdBackupConfigCondition {
  // Type of EtcdBackupConfig condition.
  type: EtcdBackupConfigConditionType;
  // Status of the condition, one of True, False, Unknown.
  status: ConditionStatus;
  // Last time we got an update on a given condition.
  lastHeartbeatTime?: Date;
  // Last time the condition transit from one status to another.
  lastTransitionTime?: Date;
  // (brief) reason for the condition's last transition.
  reason?: string;
  // Human readable message indicating details about last transition.
  message?: string;
}

export enum EtcdBackupConfigConditionType {
  EtcdBackupConfigConditionSchedulingActive = 'SchedulingActive',
}

export enum ConditionStatus {
  ConditionTrue = 'True',
  ConditionFalse = 'False',
  ConditionUnknown = 'Unknown',
}

type BackupStatusPhase = string;

export const BackupStatusPhaseCompleted = 'Completed';

export class EtcdRestore {
  name?: string;

  spec: EtcdRestoreSpec;
  status: EtcdRestoreStatus;
}

export class EtcdRestoreSpec {
  clusterId: string;
  backupName: string;
  backupDownloadCredentialsSecret?: string;
}

export class EtcdRestoreStatus {
  phase: EtcdRestorePhase;
  restoreTime?: Date;
}

export enum EtcdRestorePhase {
  Started = 'Started',
  StsRebuilding = 'StsRebuilding',
  Completed = 'Completed',
}

export class BackupCredentials {
  backup_credentials: S3Credentials;
}

export class S3Credentials {
  s3: S3BackupCredentials;
}

export class S3BackupCredentials {
  accessKeyId: string;
  secretAccessKey: string;
}
