// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//     http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges} from '@angular/core';
import {MatDialog, MatDialogConfig} from '@angular/material/dialog';
import {DomSanitizer, SafeUrl} from '@angular/platform-browser';
import {ApiService} from '@core/services/api/service';
import * as _ from 'lodash';
import {Subject} from 'rxjs';
import {take, takeUntil} from 'rxjs/operators';
import {Addon, AddonConfig, getAddonLogoData, hasAddonLogoData} from '../../entity/addon';
import {ConfirmationDialogComponent} from '../confirmation-dialog/confirmation-dialog.component';
import {EditAddonDialogComponent} from './edit-addon-dialog/edit-addon-dialog.component';
import {SelectAddonDialogComponent} from './select-addon-dialog/select-addon-dialog.component';

@Component({
  selector: 'km-addon-list',
  templateUrl: 'addon-list.component.html',
  styleUrls: ['addon-list.component.scss'],
})
export class AddonsListComponent implements OnInit, OnChanges, OnDestroy {
  @Input() addons: Addon[] = [];
  @Input() isClusterReady = true;
  @Input() canEdit = true;

  // Usage of event emitters allows to handle edits and deletions in multiple ways in different places.
  // Thanks to them this component can be used inside wizard (performing actions on a local addons array)
  // and also in the cluster view (calling API endpoints to perform any action).
  @Output() addAddon = new EventEmitter<Addon>();
  @Output() editAddon = new EventEmitter<Addon>();
  @Output() deleteAddon = new EventEmitter<Addon>();

  accessibleAddons: string[] = [];
  installableAddons: string[] = [];
  addonConfigs = new Map<string, AddonConfig>();
  private _unsubscribe: Subject<any> = new Subject();

  constructor(
    private readonly _apiService: ApiService,
    private readonly _matDialog: MatDialog,
    private readonly _domSanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this._apiService
      .getAccessibleAddons()
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(accessibleAddons => {
        this.accessibleAddons = accessibleAddons;
        this._updateInstallableAddons();
      });

    this._apiService.addonConfigs.pipe(takeUntil(this._unsubscribe)).subscribe(addonConfigs => {
      const map = new Map();
      addonConfigs.forEach(addonConfig => map.set(addonConfig.name, addonConfig));
      this.addonConfigs = map;
    });
  }

  ngOnChanges(_: SimpleChanges): void {
    this._updateInstallableAddons();
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  _updateInstallableAddons(): void {
    const installedAddons = this.addons.map(addon => {
      return addon.name;
    });

    this.installableAddons = this.accessibleAddons.filter(accessibleAddon => {
      return installedAddons.indexOf(accessibleAddon) < 0;
    });
  }

  hasLogo(name: string): boolean {
    return hasAddonLogoData(this.addonConfigs.get(name));
  }

  getAddonLogo(name: string): SafeUrl {
    return this._domSanitizer.bypassSecurityTrustUrl(getAddonLogoData(this.addonConfigs.get(name)));
  }

  canAdd(): boolean {
    return (
      this.isClusterReady &&
      this.canEdit &&
      !_.isEmpty(this.accessibleAddons) &&
      this.addons.length < this.accessibleAddons.length
    );
  }

  getAddBtnClass(): string {
    return !this.canAdd() ? 'disabled' : '';
  }

  getAddBtnTooltip(): string {
    if (!this.canEdit) {
      return 'You have no permissions to edit addons in this cluster.';
    } else if (this.accessibleAddons.length === 0) {
      return 'There are no accessible addons.';
    } else if (this.addons.length === this.accessibleAddons.length) {
      return 'All accessible addons are already installed.';
    }
    return '';
  }

  getTooltip(addon: Addon): string {
    return addon.deletionTimestamp ? 'Addon is being deleted' : '';
  }

  add(): void {
    if (this.canAdd()) {
      const dialog = this._matDialog.open(SelectAddonDialogComponent);
      dialog.componentInstance.installableAddons = this.installableAddons;
      dialog.componentInstance.addonConfigs = this.addonConfigs;
      dialog
        .afterClosed()
        .pipe(take(1))
        .subscribe(addedAddon => {
          if (addedAddon) {
            this.addAddon.emit(addedAddon);
          }
        });
    }
  }

  edit(addon: Addon): void {
    const dialog = this._matDialog.open(EditAddonDialogComponent);
    dialog.componentInstance.addon = addon;
    dialog.componentInstance.addonConfig = this.addonConfigs.get(addon.name);
    dialog
      .afterClosed()
      .pipe(take(1))
      .subscribe(editedAddon => {
        if (editedAddon) {
          this.editAddon.emit(editedAddon);
        }
      });
  }

  delete(addon: Addon): void {
    const config: MatDialogConfig = {
      data: {
        title: 'Delete Addon',
        message: `Delete ${addon.name} addon permanently?`,
        confirmLabel: 'Delete',
      },
    };

    if (addon.spec.isDefault) {
      config.data.warning = 'This is a default addon. It will be automatically restored after deletion.';
    }

    const dialog = this._matDialog.open(ConfirmationDialogComponent, config);
    dialog
      .afterClosed()
      .pipe(take(1))
      .subscribe(isConfirmed => {
        if (isConfirmed) {
          this.deleteAddon.emit(addon);
        }
      });
  }
}
