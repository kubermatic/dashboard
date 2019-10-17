import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

import {ApiService} from '../../../core/services';
import {AddonEntity} from '../../entity/AddonEntity';

@Component({
  selector: 'km-addon-list',
  templateUrl: 'addon-list.component.html',
  styleUrls: ['addon-list.component.scss'],
})
export class AddonsListComponent implements OnInit, OnDestroy {
  @Input() addons: AddonEntity[] = [];
  @Input() isClusterReady = true;
  accessibleAddons: string[] = [];
  private _unsubscribe: Subject<any> = new Subject();

  constructor(private readonly _apiService: ApiService) {}

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
}
