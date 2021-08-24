import {Cluster} from '@shared/entity/cluster';

export class EtcdBackupConfig {
  // ObjectMeta
  creationTimestamp?: Date;
  deletionTimestamp?: Date;
  id?: string;
  name: string;

  // Spec
  spec: EtcdBackupConfigSpec;

  // Status
  status?: EtcdBackupConfigStatus;
}

export class EtcdBackupConfigSpec {
  // Name defines the name of the backup
  // The name of the backup file in S3 will be <cluster>-<backup name>
  // If a schedule is set (see below), -<timestamp> will be appended.
  name: string;
  // Cluster is the reference to the cluster whose etcd will be backed up
  cluster: Cluster;
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
  currentBackups?: BackupStatus[];
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
  Type: EtcdBackupConfigConditionType;
  // Status of the condition, one of True, False, Unknown.
  Status: ConditionStatus;
  // Last time we got an update on a given condition.
  LastHeartbeatTime?: Date;
  // Last time the condition transit from one status to another.
  LastTransitionTime?: Date;
  // (brief) reason for the condition's last transition.
  Reason?: string;
  // Human readable message indicating details about last transition.
  Message?: string;
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
