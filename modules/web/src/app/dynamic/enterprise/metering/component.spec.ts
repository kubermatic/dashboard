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

import {ComponentFixture, fakeAsync, TestBed, waitForAsync} from '@angular/core/testing';
import {By} from '@angular/platform-browser';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {DatacenterService} from '@app/core/services/datacenter';
import {SharedModule} from '@app/shared/module';
import {fakeSeedSettings} from '@test/data/datacenter';
import {fakeScheduleConfiguration} from '@test/data/metering';
import {DatacenterMockService} from '@test/services/datacenter-mock';
import {MeteringMockService} from '@test/services/metering-mock';
import {MeteringComponent} from './component';
import {MeteringConfigComponent} from './config/component';
import {MeteringConfigurationDialog} from './config/config-dialog/component';
import {MeteringScheduleAddDialog} from './schedule-config/add-dialog/component';
import {MeteringScheduleConfigComponent} from './schedule-config/component';
import {MeteringScheduleEditDialog} from './schedule-config/edit-dialog/component';
import {MeteringReportListComponent} from './schedule-config/report-list/component';
import {MeteringService} from './service/metering';

describe('MeteringComponent', () => {
  let component: MeteringComponent;
  let fixture: ComponentFixture<MeteringComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [SharedModule, NoopAnimationsModule],
      declarations: [
        MeteringComponent,
        MeteringConfigComponent,
        MeteringConfigurationDialog,
        MeteringReportListComponent,
        MeteringScheduleAddDialog,
        MeteringScheduleEditDialog,
        MeteringScheduleConfigComponent,
      ],
      providers: [
        {provide: DatacenterService, useClass: DatacenterMockService},
        {provide: MeteringService, useClass: MeteringMockService},
      ],
      teardown: {destroyAfterEach: false},
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MeteringComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create metering component', () => {
    expect(component).toBeTruthy();
  });

  it('should render spinner for until missing data', fakeAsync(() => {
    const spinnerBeforeDataLoaded = fixture.debugElement.query(By.css('.km-spinner'));
    expect(spinnerBeforeDataLoaded).toBeTruthy();

    component.schedules = [fakeScheduleConfiguration('fake-schedule')];
    component.config = fakeSeedSettings().metering;
    fixture.detectChanges();

    const spinnerAfterDataLoaded = fixture.debugElement.query(By.css('.km-spinner'));
    expect(spinnerAfterDataLoaded).toBeFalsy();
  }));
});
