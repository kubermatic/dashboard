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
import {AdminPanelMainSections, ProjectSidenavMainSection, AdminPanelView, View} from '@app/shared/entity/common';
import {shrinkGrow} from '@shared/animations/grow';
@Component({
  selector: 'km-side-nav-field',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
  animations: [shrinkGrow],
})
export class SideNavExpansionMenuComponent implements AfterViewChecked, OnInit {
  private _expanded = false;
  readonly view = View;
  @Input() label = '';
  readonly projectSidenvMainSections = ProjectSidenavMainSection;
  readonly adminPanelView = AdminPanelView;
  readonly adminPanelMainSections = AdminPanelMainSections;
  @Input() icon = '';
  @Input() isSidenavCollapsed: boolean;
  @Input() lastItem = false;

  constructor(private _router: Router, private readonly _cdr: ChangeDetectorRef) {}

  get expanded(): boolean {
    return this._expanded;
  }

  get id(): string {
    return this.label.replace(' ', '-');
  }

  ngOnInit(): void {
    if (this.label === ProjectSidenavMainSection.Resources) {
      this._expanded = true;
    }
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
      case ProjectSidenavMainSection.Resources:
        return this.checkUrl(View.Clusters) || this.checkUrl(View.ExternalClusters);
      case ProjectSidenavMainSection.Backups:
        return this.checkUrl(View.Backups) || this.checkUrl(View.Snapshots) || this.checkUrl(View.Restores);
      case ProjectSidenavMainSection.Access:
        return (
          this.checkUrl(View.SSHKeys) ||
          this.checkUrl(View.Members) ||
          this.checkUrl(View.Groups) ||
          this.checkUrl(View.ServiceAccounts)
        );
      default:
        return false;
    }
  }

  isAdminSettingsExpandedActive(): boolean {
    switch (this.label) {
      case this.adminPanelMainSections.Interface:
        return (
          this.checkUrl(AdminPanelView.Defaults) ||
          this.checkUrl(AdminPanelView.Limits) ||
          this.checkUrl(AdminPanelView.Customization)
        );
      case this.adminPanelMainSections.ManageResources:
        return (
          this.checkUrl(AdminPanelView.Datacenters) ||
          this.checkUrl(AdminPanelView.ProviderPresets) ||
          this.checkUrl(AdminPanelView.BackupDestinations) ||
          this.checkUrl(AdminPanelView.ProjectQuotas) ||
          this.checkUrl(AdminPanelView.OPA) ||
          this.checkUrl(AdminPanelView.SeedConfiguration)
        );
      case this.adminPanelMainSections.Monitoring:
        return this.checkUrl(AdminPanelView.RuleGroups) || this.checkUrl(AdminPanelView.Metering);
      case this.adminPanelMainSections.Users:
        return this.checkUrl(AdminPanelView.Accounts) || this.checkUrl(AdminPanelView.Administrators);
      default:
        return false;
    }
  }

  checkUrl(url: string): boolean {
    const urlArray = this._router.routerState.snapshot.url.split('/');
    const urlExists = !!urlArray.find(x => x === url);
    if (url === View.Clusters) {
      return (urlExists && !urlArray.find(x => x === View.ExternalClusters)) || !!urlArray.find(x => x === View.Wizard);
    } else if (url === View.ExternalClusters) {
      return urlExists || !!urlArray.find(x => x === View.ExternalClusterWizard);
    }
    return urlExists;
  }

  onClick(): void {
    this._expanded = this.isExpandedActive() || !this._expanded;
  }
}
