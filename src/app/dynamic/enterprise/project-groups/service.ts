//                Kubermatic Enterprise Read-Only License
//                       Version 1.0 ("KERO-1.0”)
//                   Copyright © 2022 Kubermatic GmbH
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

import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {merge, Observable, Subject, timer} from 'rxjs';
import {retry, shareReplay, switchMap} from 'rxjs/operators';
import {AppConfigService} from '@app/config.service';
import {GroupProjectBinding, GroupProjectBindingModel} from './entity';
import {environment} from '@environments/environment';

@Injectable()
export class ProjectGroupBindingService {
  private _newRestRoot: string = environment.newRestRoot;
  private readonly _retryTime = 3;
  private readonly _maxRetries = 5;
  private readonly _refreshTime = 10;
  private _projectGroupBinding$: Observable<GroupProjectBinding[]>;
  private _projectGroupBindingMap = new Map<string, Observable<GroupProjectBinding[]>>();
  private _projectGroupBindingRefresh$ = new Subject<void>();
  private _refreshTimer$ = timer(0, this._appConfigService.getRefreshTimeBase() * this._refreshTime);

  constructor(private readonly _httpClient: HttpClient, private readonly _appConfigService: AppConfigService) {}

  projectGroupsBindings(projectID: string): Observable<GroupProjectBinding[]> {
    if (!this._projectGroupBinding$) {
      this._projectGroupBinding$ = merge(this._projectGroupBindingRefresh$, this._refreshTimer$)
        .pipe(switchMap(_ => this.list(projectID)))
        .pipe(shareReplay({refCount: true, bufferSize: 1}));
      this._projectGroupBindingMap.set(projectID, this._projectGroupBinding$);
    }
    return this._projectGroupBindingMap.get(projectID);
  }

  refreshProjectGroupBindings(): void {
    this._projectGroupBindingRefresh$.next();
  }

  list(projectID: string): Observable<GroupProjectBinding[]> {
    const url = `${this._newRestRoot}/projects/${projectID}/groupbindings`;
    return this._httpClient
      .get<GroupProjectBinding[]>(url)
      .pipe(retry({delay: this._retryTime * this._appConfigService.getRefreshTimeBase(), count: this._maxRetries}));
  }

  add(model: GroupProjectBindingModel, projectID: string): Observable<GroupProjectBinding> {
    const url = `${this._newRestRoot}/projects/${projectID}/groupbindings`;
    return this._httpClient.post<GroupProjectBinding>(url, model);
  }

  edit(groupProjectBinding: GroupProjectBinding, projectID: string): Observable<GroupProjectBinding> {
    const url = `${this._newRestRoot}/projects/${projectID}/groupbindings/${groupProjectBinding.name}`;
    return this._httpClient.patch<GroupProjectBinding>(url, groupProjectBinding);
  }

  remove(groupProjectBinding: GroupProjectBinding, projectID: string): Observable<GroupProjectBinding> {
    const url = `${this._newRestRoot}/projects/${projectID}/groupbindings/${groupProjectBinding.name}`;
    return this._httpClient.delete<GroupProjectBinding>(url);
  }
}
