import {ComponentFixture, fakeAsync, TestBed, tick} from '@angular/core/testing';
import {MatDialogRef} from '@angular/material';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';


import {ApiService} from '../../../../core/services';
import {SharedModule} from '../../../../shared/shared.module';
import {fakeDigitaloceanCluster, fakeToken} from '../../../../testing/fake-data/cluster.fake';
import {fakeDigitaloceanDatacenter} from '../../../../testing/fake-data/datacenter.fake';
import {fakeProject} from '../../../../testing/fake-data/project.fake';
import {asyncData} from '../../../../testing/services/api-mock.service';
import {MatDialogRefMock} from '../../../../testing/services/mat-dialog-ref-mock';
import {RevokeAdminTokenComponent} from './revoke-admin-token.component';

const modules: any[] = [
  BrowserModule,
  BrowserAnimationsModule,
  SharedModule,
];

describe('RevokeAdminTokenComponent', () => {
  let fixture: ComponentFixture<RevokeAdminTokenComponent>;
  let component: RevokeAdminTokenComponent;
  let editTokenSpy;

  beforeEach(() => {
    const apiMock = {'editToken': jest.fn()};
    editTokenSpy = apiMock.editToken.mockReturnValue(asyncData(fakeToken()));

    TestBed
        .configureTestingModule({
          imports: [
            ...modules,
          ],
          declarations: [
            RevokeAdminTokenComponent,
          ],
          providers: [
            {provide: ApiService, useValue: apiMock},
            {provide: MatDialogRef, useClass: MatDialogRefMock},
          ],
        })
        .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RevokeAdminTokenComponent);
    component = fixture.componentInstance;
  });

  it('should initialize', () => {
    expect(component).toBeTruthy();
  });

  it('should call editToken method', fakeAsync(() => {
       component.projectID = fakeProject().id;
       component.cluster = fakeDigitaloceanCluster();
       component.datacenter = fakeDigitaloceanDatacenter();
       component.adminToken = fakeToken();

       fixture.detectChanges();
       component.revokeAdminToken();
       tick();
       expect(editTokenSpy).toHaveBeenCalled();
     }));
});
