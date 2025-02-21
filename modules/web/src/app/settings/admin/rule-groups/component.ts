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

import {Component, OnChanges, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MatDialog, MatDialogConfig} from '@angular/material/dialog';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';
import {DialogModeService} from '@app/core/services/dialog-mode';
import {DatacenterService} from '@core/services/datacenter';
import {MLAService} from '@core/services/mla';
import {NotificationService} from '@core/services/notification';
import {UserService} from '@core/services/user';
import {ConfirmationDialogComponent} from '@shared/components/confirmation-dialog/component';
import {AdminRuleGroup, RuleGroup, RuleGroupType} from '@shared/entity/mla';
import {UserSettings} from '@shared/entity/settings';
import {DialogActionMode} from '@shared/types/common';
import _ from 'lodash';
import {Observable, Subject, combineLatest} from 'rxjs';
import {filter, map, switchMap, take, takeUntil, tap} from 'rxjs/operators';
import {AdminRuleGroupDialog} from './rule-group-dialog/component';

@Component({
    selector: 'km-admin-settings-rule-groups',
    styleUrls: ['style.scss'],
    templateUrl: 'template.html',
    standalone: false
})
export class AdminSettingsRuleGroupsComponent implements OnInit, OnChanges, OnDestroy {
  dataSource = new MatTableDataSource<AdminRuleGroup>();
  displayedColumns: string[] = ['name', 'type', 'seed', 'actions'];
  seeds: string[] = [];
  seedFilter: string;
  typeFilter: string;
  settings: UserSettings;
  ruleGroupTypes = Object.values(RuleGroupType);
  adminRuleGroups: AdminRuleGroup[] = [];

  @ViewChild(MatSort, {static: true}) sort: MatSort;
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;

  private _unsubscribe = new Subject<void>();

  constructor(
    private readonly _matDialog: MatDialog,
    private readonly _mlaService: MLAService,
    private readonly _userService: UserService,
    private readonly _notificationService: NotificationService,
    private readonly _datacenterService: DatacenterService,
    private readonly _dialogModeService: DialogModeService
  ) {}

  ngOnInit(): void {
    this.dataSource.data = this.adminRuleGroups || [];
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
    this.sort.active = 'name';
    this.sort.direction = 'asc';

    this._userService.currentUserSettings.pipe(takeUntil(this._unsubscribe)).subscribe(settings => {
      this.settings = settings;
      this.paginator.pageSize = settings.itemsPerPage;
      this.dataSource.paginator = this.paginator; // Force refresh.
    });

    this._datacenterService.seeds
      .pipe(tap(seeds => (this.seeds = seeds)))
      .pipe(
        switchMap(seeds =>
          combineLatest([
            ...seeds.map<Observable<[string, RuleGroup[]]>>(seed =>
              this._mlaService.adminRuleGroups(seed).pipe(map(ruleGroup => [seed, ruleGroup]))
            ),
          ])
        )
      )
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(ruleGroupTuples => {
        this.adminRuleGroups = ruleGroupTuples
          .map(tuple => tuple[1].map<[string, RuleGroup]>(ruleGroup => [tuple[0], ruleGroup]))
          .flatMap(tuples =>
            tuples.map(
              tuple =>
                ({seed: tuple[0], name: tuple[1].name, data: tuple[1].data, type: tuple[1].type}) as AdminRuleGroup
            )
          );

        this.dataSource.data = this.adminRuleGroups;
      });
  }

  ngOnChanges(): void {
    this.filter();
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  isPaginatorVisible(): boolean {
    return this.adminRuleGroups?.length > this.paginator?.pageSize;
  }

  hasNoData(): boolean {
    return _.isEmpty(this.adminRuleGroups);
  }

  filter(): void {
    this.dataSource.data = this.adminRuleGroups.filter(adminRuleGroup => {
      let isVisible = true;

      if (this.typeFilter) {
        isVisible = isVisible && adminRuleGroup.type === this.typeFilter;
      }

      if (this.seedFilter) {
        isVisible = isVisible && adminRuleGroup.seed === this.seedFilter;
      }

      return isVisible;
    });
  }

  add(): void {
    const dialogConfig: MatDialogConfig = {
      data: {
        title: 'Add Rule Group',
        mode: DialogActionMode.Add,
        confirmLabel: 'Add',
        seeds: this.seeds,
      },
    };

    this._matDialog.open(AdminRuleGroupDialog, dialogConfig);
  }

  edit(adminRuleGroup: AdminRuleGroup): void {
    const dialogConfig: MatDialogConfig = {
      data: {
        title: 'Edit Rule Group',
        mode: DialogActionMode.Edit,
        adminRuleGroup: adminRuleGroup,
        confirmLabel: 'Edit',
        seeds: this.seeds,
      },
    };

    this._dialogModeService.isEditDialog = true;
    this._matDialog
      .open(AdminRuleGroupDialog, dialogConfig)
      .afterClosed()
      .pipe(take(1))
      .subscribe(_ => {
        this._dialogModeService.isEditDialog = false;
      });
  }

  delete(adminRuleGroup: AdminRuleGroup): void {
    const dialogConfig: MatDialogConfig = {
      disableClose: false,
      hasBackdrop: true,
      data: {
        title: 'Delete Rule Group',
        message: `Delete <b>${adminRuleGroup.name}</b> rule group of <b>${adminRuleGroup.seed}</b> seed permanently?`,
        confirmLabel: 'Delete',
      },
    };

    this._matDialog
      .open(ConfirmationDialogComponent, dialogConfig)
      .afterClosed()
      .pipe(filter(isConfirmed => isConfirmed))
      .pipe(switchMap(_ => this._mlaService.deleteAdminRuleGroup(adminRuleGroup.seed, adminRuleGroup.name)))
      .pipe(take(1))
      .subscribe(_ => {
        this._notificationService.success(`The Rule Group ${adminRuleGroup.name} was deleted`);
        this._mlaService.refreshAdminRuleGroups();
      });
  }
}
