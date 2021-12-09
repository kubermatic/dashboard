// Copyright 2021 The Kubermatic Kubernetes Platform contributors.
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

import {Component, OnDestroy, OnInit, OnChanges, ViewChild, SimpleChanges} from '@angular/core';
import {MatDialog, MatDialogConfig} from '@angular/material/dialog';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';
import {NotificationService} from '@core/services/notification';
import {MLAService} from '@core/services/mla';
import {UserService} from '@core/services/user';
import {ConfirmationDialogComponent} from '@shared/components/confirmation-dialog/component';
import {RuleGroup, RuleGroupType} from '@shared/entity/mla';
import {MLAUtils} from '@shared/utils/mla-utils';
import {UserSettings} from '@shared/entity/settings';
import _ from 'lodash';
import {Subject} from 'rxjs';
import {filter, switchMap, take, takeUntil} from 'rxjs/operators';
import {Mode, AdminRuleGroupDialog} from './rule-group-dialog/component';

@Component({
  selector: 'km-admin-settings-rule-groups',
  styleUrls: ['style.scss'],
  templateUrl: 'template.html',
})
export class AdminSettingsRuleGroupsComponent implements OnInit, OnChanges, OnDestroy {
  ruleGroups: RuleGroup[];
  dataSource = new MatTableDataSource<RuleGroup>();
  displayedColumns: string[] = ['name', 'type', 'actions'];
  seeds: string[] = [];
  seedFilter: string;
  typeFilter: string;
  settings: UserSettings;
  ruleGroupTypes = Object.values(RuleGroupType);

  @ViewChild(MatSort, {static: true}) sort: MatSort;
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;

  private _unsubscribe = new Subject<void>();

  constructor(
    private readonly _matDialog: MatDialog,
    private readonly _mlaService: MLAService,
    private readonly _userService: UserService,
    private readonly _notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.dataSource.data = this.ruleGroups || [];
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
    this.sort.active = 'name';
    this.sort.direction = 'asc';

    this._userService.currentUserSettings.pipe(takeUntil(this._unsubscribe)).subscribe(settings => {
      this.settings = settings;
      this.paginator.pageSize = settings.itemsPerPage;
      this.dataSource.paginator = this.paginator; // Force refresh.
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.ruleGroups) {
      this.dataSource.data = this.ruleGroups;
    }
    this.filter();
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  isPaginatorVisible(): boolean {
    return (
      this.ruleGroups &&
      this.ruleGroups.length > 0 &&
      this.paginator &&
      this.ruleGroups.length > this.paginator.pageSize
    );
  }

  hasNoData(): boolean {
    return _.isEmpty(this.ruleGroups);
  }

  getName(data: string): string {
    return MLAUtils.getRuleGroupName(data);
  }

  filter(): void {
    if (!_.isEmpty(this.ruleGroups)) {
      this.dataSource.data = this.ruleGroups.filter(ruleGroup => {
        if (this.typeFilter) {
          this.typeFilter ? ruleGroup.type === this.typeFilter : true;
        }

        if (this.seedFilter) {
          this.seedFilter ? ruleGroup.type === this.seedFilter : true;
        }
      });
    }
  }

  add(): void {
    const dialogConfig: MatDialogConfig = {
      data: {
        title: 'Create Rule Group',
        mode: Mode.Add,
        confirmLabel: 'Create',
      },
    };

    this._matDialog.open(AdminRuleGroupDialog, dialogConfig);
  }

  edit(ruleGroup: RuleGroup): void {
    const dialogConfig: MatDialogConfig = {
      data: {
        title: 'Edit Rule Group',
        mode: Mode.Edit,
        ruleGroup: ruleGroup,
        confirmLabel: 'Edit',
      },
    };

    this._matDialog.open(AdminRuleGroupDialog, dialogConfig);
  }

  delete(seedName: string, ruleGroup: RuleGroup): void {
    const ruleGroupName = this.getName(ruleGroup.data);
    const dialogConfig: MatDialogConfig = {
      disableClose: false,
      hasBackdrop: true,
      data: {
        title: 'Delete Rule Group',
        message: `Delete <b>${ruleGroupName}</b> recording and alerting rule group permanently?`,
        confirmLabel: 'Delete',
      },
    };

    this._matDialog
      .open(ConfirmationDialogComponent, dialogConfig)
      .afterClosed()
      .pipe(filter(isConfirmed => isConfirmed))
      .pipe(switchMap(_ => this._mlaService.deleteAdminRuleGroup(seedName, ruleGroupName)))
      .pipe(take(1))
      .subscribe(_ => {
        this._notificationService.success(`The Rule Group ${ruleGroupName} was deleted`);
        this._mlaService.refreshRuleGroups();
      });
  }
}
