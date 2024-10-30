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
import {Observable} from 'rxjs';
import {retry} from 'rxjs/operators';
import {AppConfigService} from '@app/config.service';
import {Group, GroupModel} from './entity';
import {environment} from '@environments/environment';

@Injectable({
  providedIn: 'root',
})
export class GroupService {
  private _newRestRoot: string = environment.newRestRoot;
  private readonly _retryTime = 3;
  private readonly _maxRetries = 5;

  constructor(
    private readonly _httpClient: HttpClient,
    private readonly _appConfigService: AppConfigService
  ) {}

  list(projectID: string): Observable<Group[]> {
    const url = `${this._newRestRoot}/projects/${projectID}/groupbindings`;
    return this._httpClient
      .get<Group[]>(url)
      .pipe(retry({delay: this._retryTime * this._appConfigService.getRefreshTimeBase(), count: this._maxRetries}));
  }

  add(model: GroupModel, projectID: string): Observable<Group> {
    const url = `${this._newRestRoot}/projects/${projectID}/groupbindings`;
    return this._httpClient.post<Group>(url, model);
  }

  edit(model: GroupModel, projectID: string, bindingName: string): Observable<Group> {
    const url = `${this._newRestRoot}/projects/${projectID}/groupbindings/${bindingName}`;
    return this._httpClient.patch<Group>(url, model);
  }

  remove(projectID: string, bindingName: string): Observable<Group> {
    const url = `${this._newRestRoot}/projects/${projectID}/groupbindings/${bindingName}`;
    return this._httpClient.delete<Group>(url);
  }
}
