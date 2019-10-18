import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {MatDialog, MatDialogConfig} from '@angular/material/dialog';
import {Subject} from 'rxjs';
import {first, takeUntil} from 'rxjs/operators';

import {ApiService} from '../../../core/services';
import {AddonEntity} from '../../entity/AddonEntity';
import {ConfirmationDialogComponent} from '../confirmation-dialog/confirmation-dialog.component';

import {EditAddonDialogComponent} from './edit-addon-dialog/edit-addon-dialog.component';

@Component({
  selector: 'km-addon-list',
  templateUrl: 'addon-list.component.html',
  styleUrls: ['addon-list.component.scss'],
})
export class AddonsListComponent implements OnInit, OnDestroy {
  @Input() addons: AddonEntity[] = [];
  @Input() isClusterReady = true;

  // Usage of event emitters allows to handle edits and deletions in multiple ways in different places.
  // Thanks to them this component can be used inside wizard (performing actions on a local addons array)
  // and also in the cluster view (calling API endpoints to perform any action).
  @Output() editAddon = new EventEmitter<AddonEntity>();
  @Output() deleteAddon = new EventEmitter<AddonEntity>();

  accessibleAddons: string[] = [];
  private _unsubscribe: Subject<any> = new Subject();

  constructor(private readonly _apiService: ApiService, private readonly _matDialog: MatDialog) {}

  ngOnInit(): void {
    this._apiService.getAccessibleAddons().pipe(takeUntil(this._unsubscribe)).subscribe(accessibleAddons => {
      this.accessibleAddons = accessibleAddons;
    });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  getAddBtnClass(): string {
    return !this.isClusterReady || this.accessibleAddons.length === 0 ||
            this.addons.length === this.accessibleAddons.length ?
        'disabled' :
        '';
  }

  getAddBtnTooltip(): string {
    if (!this.isClusterReady) {
      return 'The cluster is not ready yet.';
    } else if (this.accessibleAddons.length === 0) {
      return 'There are no accessible addons.';
    } else if (this.addons.length === this.accessibleAddons.length) {
      return 'All accessible addons are already installed.';
    } else {
      return '';
    }
  }

  edit(addon: AddonEntity): void {
    const dialog = this._matDialog.open(EditAddonDialogComponent);
    dialog.componentInstance.addon = addon;
    dialog.afterClosed().pipe(first()).subscribe(editedAddon => {
      if (!!editedAddon) {
        this.editAddon.emit(editedAddon);
      }
    });
  }

  delete(addon: AddonEntity): void {
    const config: MatDialogConfig = {
      data: {
        title: 'Delete Addon',
        message: `Are you sure you want to permanently delete addon "<strong>${addon.name}</strong>"?`,
        confirmLabel: 'Delete',
      },
    };

    if (addon.spec.isDefault) {
      config.data.warning = 'This is a default addon. It means it will be recreated after deletion.';
    }

    const dialog = this._matDialog.open(ConfirmationDialogComponent, config);
    dialog.afterClosed().pipe(first()).subscribe(isConfirmed => {
      if (!!isConfirmed) {
        this.deleteAddon.emit(addon);
      }
    });
  }
}
