//                Kubermatic Enterprise Read-Only License
//                       Version 1.0 ("KERO-1.0”)
//                   Copyright © 2020 Kubermatic GmbH
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

import {environment} from '@environments/environment';
import {MeteringConfiguration, MeteringCredentials} from '@shared/entity/datacenter';
import {Observable, Subject} from 'rxjs';

@Injectable()
export class MeteringService {
  private _restRoot: string = environment.restRoot;
  readonly onConfigurationChange$ = new Subject<void>();
  readonly onCredentialsChange$ = new Subject<void>();

  constructor(private readonly _http: HttpClient) {}

  saveConfiguration(configuration: MeteringConfiguration): Observable<void> {
    const url = `${this._restRoot}/admin/metering/configurations`;
    return this._http.put<void>(url, configuration);
  }

  saveCredentials(credentials: MeteringCredentials): Observable<void> {
    const url = `${this._restRoot}/admin/metering/credentials`;
    return this._http.put<void>(url, credentials);
  }
}
