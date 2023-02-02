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

import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
  TemplateRef,
} from '@angular/core';
import {WizardMode} from '@app/wizard/types/wizard-mode';
import {slideOut} from '@shared/animations/slide';
import {Router} from '@angular/router';
import {ClusterTemplate} from '@shared/entity/cluster-template';
import {Project} from '@shared/entity/project';
import {MemberUtils, Permission} from '@shared/utils/member';
import {View} from '@shared/entity/common';
import {Member} from '@shared/entity/member';
import {GroupConfig} from '@shared/model/Config';
import {UserService} from '@core/services/user';
import {filter, Subject, take, takeUntil} from 'rxjs';
import {MatDialog} from '@angular/material/dialog';
import {
  AddClusterFromTemplateDialogComponent,
  AddClusterFromTemplateDialogData,
} from '@shared/components/add-cluster-from-template-dialog/component';
import {
  AddAutomaticBackupDialogComponent,
  AddAutomaticBackupDialogConfig,
} from '@app/backup/list/automatic-backup/add-dialog/component';
import {AddSnapshotDialogComponent, AddSnapshotDialogConfig} from '@app/backup/list/snapshot/add-dialog/component';
import {QuotaWidgetComponent} from '@dynamic/enterprise/quotas/quota-widget/component';
import {SettingsService} from '@app/core/services/settings';

@Component({
  selector: 'km-create-resource-panel',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
  animations: [slideOut],
})
export class CreateResourcePanelComponent implements OnInit, OnDestroy {
  @ViewChild('quotaWidget') quotaWidget: TemplateRef<QuotaWidgetComponent>;

  @Input() project: Project;
  @Input() clusterTemplates: ClusterTemplate[];
  @Output() refreshClusters = new EventEmitter<void>();
  @Output() refreshExternalClusters = new EventEmitter<void>();
  @Output() refreshClusterTemplates = new EventEmitter<void>();
  @Output() refreshBackups = new EventEmitter<void>();

  areExternalClustersEnabled = false;
  projectViewOnlyToolTip =
    'You do not have permission to perform this action. Contact the project owner to change your membership role';

  private _user: Member;
  private _currentGroupConfig: GroupConfig;
  private _isOpen = false;
  private readonly _unsubscribe = new Subject<void>();

  constructor(
    private readonly _elementRef: ElementRef,
    private readonly _router: Router,
    private readonly _matDialog: MatDialog,
    private readonly _userService: UserService,
    private readonly _settingsService: SettingsService
  ) {}

  ngOnInit(): void {
    this._userService.currentUser.pipe(take(1)).subscribe(user => (this._user = user));

    this._userService
      .getCurrentUserGroup(this.project.id)
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(userGroup => (this._currentGroupConfig = this._userService.getCurrentUserGroupConfig(userGroup)));

    this._settingsService.adminSettings.pipe(takeUntil(this._unsubscribe)).subscribe(settings => {
      this.areExternalClustersEnabled = settings.enableExternalClusterImport;
    });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  @HostListener('document:click', ['$event'])
  onOutsideClick(event: Event): void {
    if (!this._elementRef.nativeElement.contains(event.target) && this.isOpen) {
      this.close();
    }
  }

  get canCreateCluster(): boolean {
    return MemberUtils.hasPermission(this._user, this._currentGroupConfig, View.Clusters, Permission.Create);
  }

  get canCreateBackups(): boolean {
    return MemberUtils.hasPermission(this._user, this._currentGroupConfig, View.Backups, Permission.Create);
  }

  get isOpen(): boolean {
    return this._isOpen;
  }

  close(): void {
    this._isOpen = false;
  }

  toggle(): void {
    this._isOpen = !this._isOpen;
  }

  openClusterWizard(): void {
    this._router.navigate([`/projects/${this.project.id}/wizard`]);
  }

  openExternalClusterWizard(): void {
    this._router.navigate([`/projects/${this.project.id}/external-cluster-wizard`]);
  }

  createClusterFromTemplate(): void {
    this.close();
    const dialog = this._matDialog.open<AddClusterFromTemplateDialogComponent, AddClusterFromTemplateDialogData>(
      AddClusterFromTemplateDialogComponent,
      {
        data: {projectId: this.project.id, quotaWidget: this.quotaWidget},
      }
    );
    dialog
      .afterClosed()
      .pipe(filter(confirmed => confirmed))
      .pipe(take(1))
      .subscribe(_ => this.refreshClusters.next());
  }

  createClusterTemplate(): void {
    this._router.navigate([`/projects/${this.project.id}/wizard`], {state: {mode: WizardMode.CreateClusterTemplate}});
  }

  createAutomaticBackup(): void {
    this.close();
    const dialog = this._matDialog.open(AddAutomaticBackupDialogComponent, {
      data: {projectID: this.project.id} as AddAutomaticBackupDialogConfig,
    });
    dialog
      .afterClosed()
      .pipe(filter(confirmed => confirmed))
      .pipe(take(1))
      .subscribe(_ => this.refreshBackups.next());
  }

  createSnapshot(): void {
    this.close();
    this._matDialog.open(AddSnapshotDialogComponent, {data: {projectID: this.project.id} as AddSnapshotDialogConfig});
  }

  onActivate(component: QuotaWidgetComponent): void {
    component.projectId = this.project.id;
    component.showQuotaWidgetDetails = true;
    component.showIcon = true;
  }
}
