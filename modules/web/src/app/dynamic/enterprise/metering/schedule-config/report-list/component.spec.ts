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

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {By} from '@angular/platform-browser';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {AppConfigService} from '@app/config.service';
import {Auth} from '@app/core/services/auth/service';
import {UserService} from '@app/core/services/user';
import {MeteringService} from '@app/dynamic/enterprise/metering/service/metering';
import {SharedModule} from '@app/shared/module';
import {AppConfigMockService} from '@test/services/app-config-mock';
import {AuthMockService} from '@test/services/auth-mock';
import {MeteringMockService} from '@test/services/metering-mock';
import {UserMockService} from '@test/services/user-mock';
import {MeteringReportListComponent} from './component';
import {RouterTestingModule} from '@angular/router/testing';

describe('MeteringReportListComponent', () => {
  let component: MeteringReportListComponent;
  let fixture: ComponentFixture<MeteringReportListComponent>;
  let meteringService: MeteringService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [SharedModule, NoopAnimationsModule, HttpClientTestingModule, RouterTestingModule],
      declarations: [MeteringReportListComponent],
      providers: [
        {provide: MeteringService, useClass: MeteringMockService},
        {provide: AppConfigService, useClass: AppConfigMockService},
        {provide: Auth, useClass: AuthMockService},
        {provide: UserService, useClass: UserMockService},
      ],
      teardown: {destroyAfterEach: false},
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MeteringReportListComponent);
    component = fixture.componentInstance;
    component.scheduleName = 'km-weekly';
    component.schedule = '0 1 * * 1';
    component.interval = 1;
    component.reports = [
      {
        name: 'km-weekly.csv',
        lastModified: new Date('2021-09-16T11:14:28Z'),
        size: 5559,
      },
    ];
    meteringService = fixture.debugElement.injector.get(MeteringService);
  });

  it('should create metering report list component', () => {
    expect(component).toBeTruthy();
  });

  it('should trigger report download', () => {
    const spyMeteringSvc = jest.spyOn(meteringService, 'reportDownload');
    fixture.detectChanges();
    const downloadReportBtn = fixture.debugElement.query(By.css('#km-download-report-button'));
    downloadReportBtn.triggerEventHandler('throttleClick', null);
    expect(spyMeteringSvc).toHaveBeenCalledWith(component.reports[0].name, component.scheduleName);
  });
});
