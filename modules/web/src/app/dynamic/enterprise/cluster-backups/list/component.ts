//                Kubermatic Enterprise Read-Only License
//                       Version 1.0 ("KERO-1.0”)
//                   Copyright © 2023 Kubermatic GmbH
//
// 1. You may only view, read and display for studying purposes the source
//    code of the software licensed under this license, and, to the extent
//    explicitly provided under this license, the binary code.
// 2. Any use of the software which exceeds the foregoing right, including,
//    without limitation, its execution, compilation, copying, modification
//    and distribution, is expressly prohibited.
// 3. THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND,
//    EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
//    MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
//    IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
//    CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
//    TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
//    SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
//
// END OF TERMS AND CONDITIONS

import {Component, OnDestroy, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {SettingsService} from '@app/core/services/settings';
import {View} from '@app/shared/entity/common';
import {AdminSettings} from '@app/shared/entity/settings';
import {Subject, takeUntil} from 'rxjs';

@Component({
    selector: 'km-cluster-backups',
    templateUrl: './template.html',
    standalone: false
})
export class ClusterBackupsComponent implements OnInit, OnDestroy {
  readonly view = View;
  clustersBackupView: string;
  adminSettings: AdminSettings;
  private _unsubscribe = new Subject<void>();

  constructor(
    private _router: Router,
    private readonly _settingsService: SettingsService
  ) {}

  ngOnInit(): void {
    this.getClusterBackupsView();
    this._settingsService.adminSettings.pipe(takeUntil(this._unsubscribe)).subscribe(settings => {
      this.adminSettings = settings;
    });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  getClusterBackupsView(): void {
    const urlArray = this._router.routerState.snapshot.url.split('/');
    this.clustersBackupView = urlArray[urlArray.length - 1];
  }
}
