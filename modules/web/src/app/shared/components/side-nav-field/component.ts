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

import {AfterViewChecked, ChangeDetectorRef, Component, Input, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {AdminPanelSections, AdminPanelView, ProjectSidenavSection, View} from '@app/shared/entity/common';
import {shrinkGrow} from '@shared/animations/grow';
@Component({
    selector: 'km-side-nav-field',
    templateUrl: './template.html',
    styleUrls: ['./style.scss'],
    animations: [shrinkGrow],
    standalone: false
})
export class SideNavExpansionMenuComponent implements AfterViewChecked, OnInit {
  private _expanded = false;
  readonly view = View;
  @Input() label: ProjectSidenavSection | AdminPanelSections;
  readonly projectSidenavSections = ProjectSidenavSection;
  readonly adminPanelView = AdminPanelView;
  readonly adminPanelSections = AdminPanelSections;
  @Input() icon = '';
  @Input() isSidenavCollapsed: boolean;
  @Input() lastItem = false;

  constructor(
    private _router: Router,
    private readonly _cdr: ChangeDetectorRef
  ) {}

  get expanded(): boolean {
    return this._expanded;
  }

  get id(): string {
    return this.label.replace(' ', '-');
  }

  ngOnInit(): void {
    this._expanded = this.label === ProjectSidenavSection.Resources;
  }

  ngAfterViewChecked(): void {
    if (this.isExpandedActive()) {
      this._expanded = true;
    }
    this._cdr.detectChanges();
  }

  isExpandedActive(): boolean {
    const urlArray = this._router.routerState.snapshot.url.split('/');

    if (urlArray.includes(View.Settings)) {
      return this.isAdminSettingsExpandedActive();
    } else if (urlArray.includes(View.Projects)) {
      return this.isProjectExpandedActive();
    }
    return false;
  }

  isProjectExpandedActive(): boolean {
    switch (this.label) {
      case ProjectSidenavSection.Resources:
        return (
          this.checkUrl(View.Clusters) || this.checkUrl(View.ExternalClusters) || this.checkUrl(View.KubeOneClusters)
        );
      case ProjectSidenavSection.Backups:
        return this.checkUrl(View.Backups) || this.checkUrl(View.Snapshots) || this.checkUrl(View.Restores);
      case ProjectSidenavSection.Access:
        return (
          this.checkUrl(View.SSHKeys) ||
          this.checkUrl(View.Members) ||
          this.checkUrl(View.Groups) ||
          this.checkUrl(View.ServiceAccounts)
        );
      case ProjectSidenavSection.ClusterBackups:
        return (
          this.checkUrl(View.ClusterBackup) ||
          this.checkUrl(View.ClusterRestore) ||
          this.checkUrl(View.ClusterSchedule) ||
          this.checkUrl(View.BackupStorageLocation)
        );
      default:
        return false;
    }
  }

  isAdminSettingsExpandedActive(): boolean {
    switch (this.label) {
      case AdminPanelSections.Interface:
        return this.checkAdminInterfaceUrl();
      case AdminPanelSections.ManageResources:
        return this.checkAdminManageResourcesUrl();
      case AdminPanelSections.Monitoring:
        return this.checkUrl(AdminPanelView.RuleGroups) || this.checkUrl(AdminPanelView.Metering);
      case AdminPanelSections.Users:
        return this.checkUrl(AdminPanelView.Accounts) || this.checkUrl(AdminPanelView.Administrators);
      default:
        return false;
    }
  }

  checkUrl(url: string): boolean {
    const urlArray = this._router.routerState.snapshot.url.split('/');
    const urlExists = !!urlArray.find(x => x === url);
    const mode = window.history.state?.mode;
    if (url === View.Clusters) {
      return (
        (urlExists && !urlArray.find(x => x === View.ExternalClusters || x === View.KubeOneClusters)) ||
        (!!urlArray.find(x => x === View.Wizard) && !mode)
      );
    } else if (url === View.ExternalClusters) {
      return urlExists || !!urlArray.find(x => x === View.ExternalClusterWizard);
    } else if (url === View.KubeOneClusters) {
      return urlExists || !!urlArray.find(x => x === View.KubeOneWizard);
    }
    return urlExists;
  }

  checkAdminInterfaceUrl(): boolean {
    return (
      this.checkUrl(AdminPanelView.Defaults) ||
      this.checkUrl(AdminPanelView.Limits) ||
      this.checkUrl(AdminPanelView.Customization) ||
      this.checkUrl(AdminPanelView.Announcements)
    );
  }

  checkAdminManageResourcesUrl(): boolean {
    return (
      this.checkUrl(AdminPanelView.Datacenters) ||
      this.checkUrl(AdminPanelView.ProviderPresets) ||
      this.checkUrl(AdminPanelView.BackupDestinations) ||
      this.checkUrl(AdminPanelView.ProjectQuotas) ||
      this.checkUrl(AdminPanelView.OPA) ||
      this.checkUrl(AdminPanelView.SeedConfiguration) ||
      this.checkUrl(AdminPanelView.Applications)
    );
  }

  onClick(): void {
    this._expanded = this.isExpandedActive() || !this._expanded;
  }
}
