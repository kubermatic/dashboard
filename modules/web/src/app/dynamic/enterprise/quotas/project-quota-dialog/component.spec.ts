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

import {
  MatLegacyDialogModule as MatDialogModule,
  MatLegacyDialogRef as MatDialogRef,
  MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA,
} from '@angular/material/legacy-dialog';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {TestBed, ComponentFixture} from '@angular/core/testing';
import {BrowserModule} from '@angular/platform-browser';
import {ProjectService} from '@core/services/project';
import {QuotaService} from '../service';
import {UserService} from '@core/services/user';
import {SharedModule} from '@shared/module';
import {MatDialogRefMock} from '@test/services/mat-dialog-ref-mock';
import {ProjectMockService} from '@test/services/project-mock';
import {QuotaMockService} from '@test/services/quota-mock';
import {UserMockService} from '@test/services/user-mock';
import {ProjectQuotaDialogComponent} from './component';
import {GlobalModule} from '@core/services/global/module';

describe('AddProjectQuotaDialogComponent', () => {
  let fixture: ComponentFixture<ProjectQuotaDialogComponent>;
  let component: ProjectQuotaDialogComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ProjectQuotaDialogComponent],
      imports: [BrowserModule, NoopAnimationsModule, SharedModule, MatDialogModule, GlobalModule],
      providers: [
        {provide: QuotaService, useClass: QuotaMockService},
        {provide: UserService, useClass: UserMockService},
        {provide: ProjectService, useClass: ProjectMockService},
        {provide: MatDialogRef, useClass: MatDialogRefMock},
        {provide: MAT_DIALOG_DATA, useValue: {}},
      ],
    }).compileComponents();
  });

  beforeEach(async () => {
    fixture = TestBed.createComponent(ProjectQuotaDialogComponent);
    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  it('should initialize', async () => {
    expect(component).toBeTruthy();
  });
});
