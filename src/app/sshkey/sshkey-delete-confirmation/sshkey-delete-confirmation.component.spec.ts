import { HttpClientModule } from '@angular/common/http';
import { async, ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { SlimLoadingBarModule } from 'ng2-slim-loading-bar';
import { of } from 'rxjs';
import { ApiService } from '../../core/services/api/api.service';
import { fakeProject } from '../../testing/fake-data/project.fake';
import { fakeSSHKeys } from '../../testing/fake-data/sshkey.fake';
import { ApiMockService } from '../../testing/services/api-mock.service';
import { SharedModule } from './../../shared/shared.module';
import { RouterStub, RouterTestingModule } from './../../testing/router-stubs';
import { MatDialogRefMock } from './../../testing/services/mat-dialog-ref-mock';
import { SSHKeyDeleteConfirmationComponent } from './sshkey-delete-confirmation.component';

const modules: any[] = [
  BrowserModule,
  HttpClientModule,
  BrowserAnimationsModule,
  SlimLoadingBarModule.forRoot(),
  RouterTestingModule,
  SharedModule,
];

describe('SSHKeyDeleteConfirmationComponent', () => {
  let fixture: ComponentFixture<SSHKeyDeleteConfirmationComponent>;
  let component: SSHKeyDeleteConfirmationComponent;
  let apiService: ApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        ...modules,
      ],
      declarations: [
        SSHKeyDeleteConfirmationComponent,
      ],
      providers: [
        { provide: MatDialogRef, useClass: MatDialogRefMock },
        { provide: ApiService, useClass: ApiMockService },
        { provide: Router, useClass: RouterStub },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SSHKeyDeleteConfirmationComponent);
    component = fixture.componentInstance;

    apiService = fixture.debugElement.injector.get(ApiService);
    fixture.debugElement.injector.get(Router);
  });

  it('should create the delete SSH key confirmation cmp', async(() => {
    expect(component).toBeTruthy();
  }));

  it('should call deleteSSHKey method', fakeAsync(() => {
    component.projectId = fakeProject().id;
    component.sshKey = fakeSSHKeys()[0];

    fixture.detectChanges();
    const spyDeleteSSHKey = spyOn(apiService, 'deleteSSHKey').and.returnValue(of(null));

    component.deleteSSHKey();
    tick();

    expect(spyDeleteSSHKey.and.callThrough()).toHaveBeenCalled();
  }));
});
