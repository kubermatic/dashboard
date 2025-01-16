// Copyright 2024 The Kubermatic Kubernetes Platform contributors.
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

import {Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {provideNativeDateAdapter} from '@angular/material/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {DialogModeService} from '@app/core/services/dialog-mode';
import {NotificationService} from '@app/core/services/notification';
import {AdminAnnouncement} from '@app/shared/entity/settings';
import {Observable, of, Subject} from 'rxjs';

// announcements: string[] = [
//   'Cluster maintenance scheduled for Nov 28 from 01:00 AM to 05:00 AM UTC.',
//   'New Kubernetes 1.25 features are now available. Check the documentation for more details.',
//   'Access to resource "X" is being deprecated on Dec 15. Please migrate to resource "Y".',
//   'The monitoring system has been upgraded. Expect improved performance and new metrics.',
//   'Reminder: API tokens created before Jan 2023 will expire on Dec 31, 2024.',
//   'The control plane will undergo a brief restart on Nov 30 at 02:00 AM UTC. Expect minor interruptions.',
//   'A security patch for CVE-2024-12345 has been applied across all clusters.',
//   'We’ve updated the ingress configuration rules. Please verify your applications for compliance.',
//   'Persistent volume storage quotas will increase to 1TB per namespace starting Dec 1.',
//   'The default container runtime will switch to containerd on Jan 15, 2025.',
//   'New node pool scaling features are live! Scale workloads dynamically based on usage.',
//   'Upcoming webinar: "Optimizing Workloads in Kubernetes 1.25" on Dec 5. Register now.',
//   'Reminder: Submit your feedback on the beta dashboard by Nov 30.',
//   'Scheduled deprecation of PodSecurityPolicy on Jan 31, 2025. Adopt OPA or Kyverno policies.',
//   'A new tutorial is available: "Configuring Horizontal Pod Autoscalers".',
//   'Kubectl 1.27 is now supported. Upgrade your CLI for better compatibility.',
//   'Load balancer limits per cluster are now set to 50. Contact support for higher quotas.',
//   'Weekly backup snapshots will occur every Sunday at 03:00 AM UTC.',
//   'New feature: Multi-cluster management is enabled for Enterprise-tier users.',
//   'Cluster node pool scaling might be slower due to ongoing infrastructure upgrades.'
// ];

export enum Controls {
  Message = 'message',
  IsActive = 'isActive',
  ExpireDate = 'expireDate',
  ExpireTime = 'expireTime',
}

@Component({
  selector: 'km-admin-announcement-dialog',
  templateUrl: 'template.html',
  styleUrls: ['./style.scss'],
  providers: [provideNativeDateAdapter()],
})
export class AdminAnnouncementDialogComponent implements OnInit, OnDestroy {
  private readonly _unsubscribe = new Subject<void>();
  Controls = Controls;
  form: FormGroup;
  isEditDialog: boolean = false;

  constructor(
    public _matDialogRef: MatDialogRef<AdminAnnouncementDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Map<string,AdminAnnouncement>,
    private readonly _dialogModeService: DialogModeService,
    private readonly _dialogRef: MatDialogRef<AdminAnnouncementDialogComponent>,
    private readonly _notificationService: NotificationService
  ) {}

  get dialogTitle(): string {
    return this._dialogModeService.isEditDialog ? 'Edit Announcement' : 'Add Announcement';
  }

  get label(): string {
    return this._dialogModeService.isEditDialog ? 'Save' : 'Add';
  }

  get icon(): string {
    return this.isEditDialog ? 'km-icon-edit' : 'km-icon-add';
  }

  ngOnInit(): void {
    this.isEditDialog = this._dialogModeService.isEditDialog;
    let announcement: AdminAnnouncement;
    if (this.data) {
      announcement = Object.values(this.data)[0]
    }
    this.form = new FormGroup({
      [Controls.Message]: new FormControl(announcement?.message ?? '', [Validators.required]),
      [Controls.IsActive]: new FormControl(announcement?.isActive ?? true),
      [Controls.ExpireDate]: new FormControl(announcement?.expires ? new Date(announcement?.expires) : new Date()),
      [Controls.ExpireTime]: new FormControl(this.getTime(announcement?.expires)),
    });

    this.form.get(Controls.ExpireTime).setValue(this.getTime(announcement?.expires));
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  getObservable(): Observable<AdminAnnouncement> {
    if (!this.form) {
      return of({} as AdminAnnouncement)
    }
    const expiresDate = new Date(this.form.get(Controls.ExpireDate).value);
    const expiresTime = this.form.get(Controls.ExpireTime).value;

    const [hours, minutes] = expiresTime.split(':').map(Number);
    expiresDate.setHours(hours, minutes);

    const announcement: AdminAnnouncement = {
      message: this.form.get(Controls.Message).value,
      isActive: this.form.get(Controls.IsActive).value,
      expires: expiresDate.toISOString(),
      createdAt: new Date().toISOString(),
    };
    return of(announcement);
  }

  onNext(announcement: AdminAnnouncement): void {
    this._dialogRef.close(announcement);
    this._notificationService.success('created new announcement');
  }

  getTime(date?: string): string {
    if (!date) {
      return '00:00';
    }
    const newDate = new Date(date);
    const numOfDigits = 2;
    return `${newDate.getHours().toString().padStart(numOfDigits, '0')}:${newDate.getMinutes().toString().padStart(numOfDigits, '0')}`;
  }
}
