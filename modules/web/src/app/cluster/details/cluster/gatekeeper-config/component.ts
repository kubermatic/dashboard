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

import {Component, Input, OnChanges, OnDestroy, SimpleChanges} from '@angular/core';
import {MatDialog, MatDialogConfig} from '@angular/material/dialog';
import {MatTableDataSource} from '@angular/material/table';
import {NotificationService} from '@core/services/notification';
import {OPAService} from '@core/services/opa';
import {ConfirmationDialogComponent} from '@shared/components/confirmation-dialog/component';
import {Cluster} from '@shared/entity/cluster';
import {GVK, GatekeeperConfig, MatchEntry, Trace} from '@shared/entity/opa';
import {DialogActionMode} from '@shared/types/common';
import _ from 'lodash';
import {Subject} from 'rxjs';
import {filter, switchMap, take} from 'rxjs/operators';
import {GatekeeperConfigDialog} from './gatekeeper-config-dialog/component';

@Component({
  selector: 'km-gatekeeper-config',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
  standalone: false,
})
export class GatekeeperConfigComponent implements OnChanges, OnDestroy {
  @Input() cluster: Cluster;
  @Input() projectID: string;
  @Input() isClusterRunning: boolean;
  @Input() gatekeeperConfig: GatekeeperConfig;

  syncDataSource = new MatTableDataSource<GVK>();
  syncDisplayedColumns: string[] = ['group', 'version', 'kind'];
  matchDataSource = new MatTableDataSource<MatchEntry>();
  matchDisplayedColumns: string[] = ['excludedNamespaces', 'processes'];
  validationDataSource = new MatTableDataSource<Trace>();
  validationDisplayedColumns: string[] = ['user', 'group', 'version', 'kind', 'dump'];

  private readonly _unsubscribe = new Subject<void>();

  constructor(
    private readonly _matDialog: MatDialog,
    private readonly _opaService: OPAService,
    private readonly _notificationService: NotificationService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (!!changes.gatekeeperConfig && !!this.gatekeeperConfig) {
      this.syncDataSource.data = _.get(this.gatekeeperConfig, 'spec.sync.syncOnly') || [];
      this.matchDataSource.data = _.get(this.gatekeeperConfig, 'spec.match') || [];
      this.validationDataSource.data = _.get(this.gatekeeperConfig, 'spec.validation.traces') || [];
    }
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  isLoadingData(): boolean {
    return _.isEmpty(this.gatekeeperConfig) && !this.isClusterRunning;
  }

  hasNoData(): boolean {
    return _.isEmpty(this.gatekeeperConfig) && this.isClusterRunning;
  }

  hasSection(section: string): boolean {
    return (
      !!this.gatekeeperConfig &&
      !!this.gatekeeperConfig.spec &&
      !!this.gatekeeperConfig.spec[section] &&
      !_.isEmpty(this.gatekeeperConfig.spec[section])
    );
  }

  toCommaSeparatedString(data: string[]): string {
    return data.join(', ');
  }

  add(): void {
    const dialogConfig: MatDialogConfig = {
      data: {
        title: 'Add Gatekeeper Config',
        projectId: this.projectID,
        cluster: this.cluster,
        mode: DialogActionMode.Add,
        confirmLabel: 'Add',
      },
    };

    this._matDialog.open(GatekeeperConfigDialog, dialogConfig);
  }

  edit(): void {
    const dialogConfig: MatDialogConfig = {
      data: {
        title: 'Edit Gatekeeper Config',
        projectId: this.projectID,
        cluster: this.cluster,
        gatekeeperConfig: this.gatekeeperConfig,
        mode: DialogActionMode.Edit,
        confirmLabel: 'Edit',
      },
    };

    this._matDialog.open(GatekeeperConfigDialog, dialogConfig);
  }

  delete(): void {
    const dialogConfig: MatDialogConfig = {
      data: {
        title: 'Delete Gatekeeper Config',
        message: `Delete OPA gatekeeper config of <b>${_.escape(this.cluster.name)}</b> cluster permanently?`,
        confirmLabel: 'Delete',
      },
    };

    this._matDialog
      .open(ConfirmationDialogComponent, dialogConfig)
      .afterClosed()
      .pipe(filter(isConfirmed => isConfirmed))
      .pipe(switchMap(_ => this._opaService.deleteGatekeeperConfig(this.projectID, this.cluster.id)))
      .pipe(take(1))
      .subscribe(_ => {
        this._notificationService.success('Deleting the Gatekeeper config');
        this._opaService.refreshGatekeeperConfig();
      });
  }
}
