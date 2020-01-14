import {ComponentFixture, fakeAsync, TestBed, tick} from '@angular/core/testing';
import {MatDialogRef} from '@angular/material/dialog';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';


import {ApiService} from '../../../../core/services';
import {SharedModule} from '../../../../shared/shared.module';
import {fakeDigitaloceanCluster, fakeToken} from '../../../../testing/fake-data/cluster.fake';
import {fakeDigitaloceanDatacenter} from '../../../../testing/fake-data/datacenter.fake';
import {fakeProject} from '../../../../testing/fake-data/project.fake';
import {asyncData} from '../../../../testing/services/api-mock.service';
import {MatDialogRefMock} from '../../../../testing/services/mat-dialog-ref-mock';
import {RevokeViewerTokenComponent} from './revoke-viewer-token.component';

const modules: any[] = [
  BrowserModule,
  BrowserAnimationsModule,
  SharedModule,
];

describe('RevokeViewerTokenComponent', () => {
  let fixture: ComponentFixture<RevokeViewerTokenComponent>;
  let component: RevokeViewerTokenComponent;
  let editTokenSpy;

  beforeEach(() => {
    const apiMock = {'editViewerToken': jest.fn()};
    editTokenSpy = apiMock.editViewerToken.mockReturnValue(asyncData(fakeToken()));

    TestBed
        .configureTestingModule({
          imports: [
            ...modules,
          ],
          declarations: [
            RevokeViewerTokenComponent,
          ],
          providers: [
            {provide: ApiService, useValue: apiMock},
            {provide: MatDialogRef, useClass: MatDialogRefMock},
          ],
        })
        .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RevokeViewerTokenComponent);
    component = fixture.componentInstance;
  });

  it('should initialize', () => {
    expect(component).toBeTruthy();
  });

  it('should call editViewerToken method', fakeAsync(() => {
       component.projectID = fakeProject().id;
       component.cluster = fakeDigitaloceanCluster();
       component.datacenter = fakeDigitaloceanDatacenter();
       component.viewerToken = fakeToken();

       fixture.detectChanges();
       component.revokeViewerToken();
       tick();
       expect(editTokenSpy).toHaveBeenCalled();
     }));
});
