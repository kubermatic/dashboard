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
import {
  MatLegacyDialogRef as MatDialogRef,
  MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA,
} from '@angular/material/legacy-dialog';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {SharedModule} from '@app/shared/module';
import {MatDialogRefMock} from '@test/services/mat-dialog-ref-mock';
import {MeteringMockService} from '@test/services/metering-mock';
import {MeteringService} from '../../service/metering';
import {MeteringScheduleAddDialog} from './component';

describe('MeteringScheduleAddDialog', () => {
  let fixture: ComponentFixture<MeteringScheduleAddDialog>;
  let component: MeteringScheduleAddDialog;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [SharedModule, NoopAnimationsModule],
      declarations: [MeteringScheduleAddDialog],
      providers: [
        {provide: MeteringService, useClass: MeteringMockService},
        {provide: MatDialogRef, useClass: MatDialogRefMock},
        {
          provide: MAT_DIALOG_DATA,
          useValue: {title: 'Add Schedule Configuration'},
        },
      ],
      teardown: {destroyAfterEach: false},
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MeteringScheduleAddDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create metering sechedule edit dialog component', () => {
    expect(component).toBeTruthy();
  });
});
