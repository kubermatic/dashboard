import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {MatDialogRef} from '@angular/material/dialog';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';

import {ApiService, NotificationService} from '../../../core/services';
import {SharedModule} from '../../../shared/shared.module';
import {fakeProject} from '../../../testing/fake-data/project.fake';
import {fakeServiceAccount, fakeServiceAccountToken} from '../../../testing/fake-data/serviceaccount.fake';
import {asyncData} from '../../../testing/services/api-mock.service';
import {MatDialogRefMock} from '../../../testing/services/mat-dialog-ref-mock';

import {EditServiceAccountTokenComponent} from './edit-serviceaccount-token.component';

const modules: any[] = [
  BrowserModule,
  BrowserAnimationsModule,
  SharedModule,
];

describe('EditServiceAccountTokenComponent', () => {
  let fixture: ComponentFixture<EditServiceAccountTokenComponent>;
  let component: EditServiceAccountTokenComponent;

  beforeEach(async(() => {
    const apiMock = {'patchServiceAccountToken': jest.fn()};
    apiMock.patchServiceAccountToken.mockReturnValue(asyncData(fakeServiceAccountToken()));

    TestBed
        .configureTestingModule({
          imports: [
            ...modules,
          ],
          declarations: [
            EditServiceAccountTokenComponent,
          ],
          providers: [
            {provide: MatDialogRef, useClass: MatDialogRefMock},
            {provide: ApiService, useValue: apiMock},
            NotificationService,
          ],
        })
        .compileComponents();
  }));

  beforeEach(async(() => {
    fixture = TestBed.createComponent(EditServiceAccountTokenComponent);
    component = fixture.componentInstance;
    component.project = fakeProject();
    component.serviceaccount = fakeServiceAccount();
    component.token = fakeServiceAccountToken();
    fixture.detectChanges();
  }));

  it('should create the edit service account token component', async(() => {
       expect(component).toBeTruthy();
     }));
});
