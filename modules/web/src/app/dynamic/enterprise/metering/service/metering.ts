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

import { HttpClient } from '@angular/common/http';
import {Injectable} from '@angular/core';
import {AppConfigService} from '@app/config.service';
import {Report} from '@app/shared/entity/metering';
import {environment} from '@environments/environment';
import {MeteringConfiguration, MeteringCredentials, MeteringReportConfiguration} from '@shared/entity/datacenter';
import {catchError, merge, Observable, of, shareReplay, Subject, switchMap, timer} from 'rxjs';

@Injectable()
export class MeteringService {
  private _restRoot: string = environment.restRoot;
  private readonly _refreshTime = 10;
  private _refreshTimer$ = timer(0, this._appConfig.getRefreshTimeBase() * this._refreshTime);
  private _scheduleConfigurations: Observable<MeteringReportConfiguration[]>;
  private _reports$ = new Map<string, Observable<Report[]>>();
  private _legacyReports$: Observable<Report[]>;
  private readonly _legacyReportPrefix = 'report-';

  readonly onConfigurationChange$ = new Subject<void>();
  readonly onCredentialsChange$ = new Subject<void>();
  readonly onScheduleConfigurationChange$ = new Subject<void>();
  readonly onReportListChange$ = new Subject<void>();

  constructor(
    private readonly _http: HttpClient,
    private readonly _appConfig: AppConfigService
  ) {}

  saveConfiguration(configuration: MeteringConfiguration): Observable<void> {
    const url = `${this._restRoot}/admin/metering/configurations`;
    return this._http.put<void>(url, configuration);
  }

  saveCredentials(credentials: MeteringCredentials): Observable<void> {
    const url = `${this._restRoot}/admin/metering/credentials`;
    return this._http.put<void>(url, credentials);
  }

  scheduleConfigurations(): Observable<MeteringReportConfiguration[]> {
    if (!this._scheduleConfigurations) {
      this._scheduleConfigurations = merge(this.onScheduleConfigurationChange$, this._refreshTimer$)
        .pipe(switchMap(_ => this._getScheduleConfigurations()))
        .pipe(shareReplay({refCount: true, bufferSize: 1}));
    }
    return this._scheduleConfigurations;
  }

  getScheduleConfiguration(name: string): Observable<MeteringReportConfiguration> {
    const url = `${this._restRoot}/admin/metering/configurations/reports/${name}`;
    return this._http.get<MeteringReportConfiguration>(url);
  }

  addScheduleConfiguration(configuration: MeteringReportConfiguration): Observable<any> {
    const url = `${this._restRoot}/admin/metering/configurations/reports/${configuration.name}`;
    const {name, ...body} = configuration;
    return this._http.post(url, body);
  }

  updateScheduleConfiguration(configuration: MeteringReportConfiguration): Observable<any> {
    const url = `${this._restRoot}/admin/metering/configurations/reports/${configuration.name}`;
    return this._http.put(url, {
      schedule: configuration.schedule,
      interval: configuration.interval,
      retention: configuration.retention,
      types: configuration.types,
    });
  }

  deleteScheduleConfiguration(name: string): Observable<any> {
    const url = `${this._restRoot}/admin/metering/configurations/reports/${name}`;
    return this._http.delete(url);
  }

  legacyReports(): Observable<Report[]> {
    if (!this._legacyReports$) {
      this._legacyReports$ = this._getReports(this._legacyReportPrefix);
    }
    return this._legacyReports$;
  }

  reports(scheduleName: string): Observable<Report[]> {
    if (!this._reports$.get(scheduleName)) {
      const reports$ = merge(this.onReportListChange$, this._refreshTimer$)
        .pipe(switchMap(() => this._getReports(scheduleName)))
        .pipe(shareReplay({refCount: true, bufferSize: 1}));
      this._reports$.set(scheduleName, reports$);
    }

    return this._reports$.get(scheduleName);
  }

  private _getReports(scheduleName?: string): Observable<Report[]> {
    const url = `${this._restRoot}/admin/metering/reports`;
    const opts = scheduleName ? {params: {configuration_name: scheduleName}} : {};
    return this._http.get<Report[]>(url, opts);
  }

  reportDownload(reportName: string, scheduleName?: string): Observable<string> {
    const url = `${this._restRoot}/admin/metering/reports/${reportName}`;
    const opts = scheduleName ? {params: {configuration_name: scheduleName}} : {};
    return this._http.get<string>(url, opts);
  }

  reportDelete(reportName: string, scheduleName?: string): Observable<any> {
    const url = `${this._restRoot}/admin/metering/reports/${reportName}`;
    const opts = scheduleName ? {params: {configuration_name: scheduleName}} : {};
    return this._http.delete(url, opts);
  }

  private _getScheduleConfigurations(): Observable<MeteringReportConfiguration[]> {
    const url = `${this._restRoot}/admin/metering/configurations/reports`;
    return this._http
      .get<MeteringReportConfiguration[]>(url)
      .pipe(catchError(() => of<MeteringReportConfiguration[]>({} as MeteringReportConfiguration[])));
  }
}
