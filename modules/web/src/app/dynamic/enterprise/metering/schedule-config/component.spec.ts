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

import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {MatLegacyDialog as MatDialog, MatLegacyDialogRef as MatDialogRef} from '@angular/material/legacy-dialog';
import {By} from '@angular/platform-browser';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {RouterTestingModule} from '@angular/router/testing';
import {MeteringService} from '@app/dynamic/enterprise/metering/service/metering';
import {ConfirmationDialogComponent} from '@app/shared/components/confirmation-dialog/component';
import {SharedModule} from '@app/shared/module';
import {fakeScheduleConfiguration} from '@test/data/metering';
import {MeteringMockService} from '@test/services/metering-mock';
import {of} from 'rxjs';
import {MeteringScheduleAddDialog} from './add-dialog/component';
import {MeteringScheduleConfigComponent} from './component';
import {MeteringScheduleEditDialog} from './edit-dialog/component';
import {MeteringReportListComponent} from './report-list/component';

class MatDialogMock {
  open(): Pick<MatDialogRef<MeteringScheduleEditDialog | MeteringScheduleAddDialog>, 'afterClosed'> {
    return {afterClosed: () => of()};
  }
}

describe('MeteringScheduleConfigComponent', () => {
  let component: MeteringScheduleConfigComponent;
  let fixture: ComponentFixture<MeteringScheduleConfigComponent>;
  let dialog: MatDialog;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [SharedModule, RouterTestingModule, NoopAnimationsModule],
      declarations: [
        MeteringReportListComponent,
        MeteringScheduleAddDialog,
        MeteringScheduleEditDialog,
        MeteringScheduleConfigComponent,
      ],
      providers: [
        {provide: MeteringService, useClass: MeteringMockService},
        {provide: MatDialog, useClass: MatDialogMock},
      ],
      teardown: {destroyAfterEach: false},
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MeteringScheduleConfigComponent);
    component = fixture.componentInstance;
    dialog = fixture.debugElement.injector.get(MatDialog);
  });

  it('should create metering schedule config component', () => {
    expect(component).toBeTruthy();
  });

  it('should open creation dialog on btn click', () => {
    fixture.detectChanges();
    const spyCreateDialog = jest.spyOn(dialog, 'open');
    const createScheduleBtn = fixture.debugElement.query(By.css('#km-create-schedule-btn'));
    createScheduleBtn.triggerEventHandler('click', null);
    expect(spyCreateDialog).toHaveBeenCalledWith(MeteringScheduleAddDialog, {
      data: {title: 'Create Schedule Configuration'},
    });
  });

  it('should open edit dialog on btn click', () => {
    const fakeSchedule = fakeScheduleConfiguration('km-weekly');
    component.schedules = [fakeSchedule];
    fixture.detectChanges();
    const spyCreateDialog = jest.spyOn(dialog, 'open');
    const updateScheduleBtn = fixture.debugElement.query(By.css('#km-update-schedule-btn'));
    updateScheduleBtn.triggerEventHandler('click', {stopPropagation: () => null});
    expect(spyCreateDialog).toHaveBeenCalledWith(MeteringScheduleEditDialog, {
      data: {
        title: 'Edit Schedule Configuration',
        scheduleName: fakeSchedule.name,
        schedule: fakeSchedule.schedule,
        interval: fakeSchedule.interval,
      },
    });
  });

  it('should open delete dialog on btn click', () => {
    const fakeSchedule = fakeScheduleConfiguration('km-weekly');
    component.schedules = [fakeSchedule];
    fixture.detectChanges();
    const spyCreateDialog = jest.spyOn(dialog, 'open');
    const deleteScheduleBtn = fixture.debugElement.query(By.css('#km-delete-schedule-btn'));
    deleteScheduleBtn.triggerEventHandler('click', {stopPropagation: () => null});
    expect(spyCreateDialog).toHaveBeenCalledWith(ConfirmationDialogComponent, {
      data: {
        title: 'Delete Schedule Configuration',
        message: `Delete <b>${fakeSchedule.name}</b> schedule permanently?`,
        confirmLabel: 'Delete',
        warning: 'Deleting this will NOT remove reports related to it.',
      },
    });
  });
});
