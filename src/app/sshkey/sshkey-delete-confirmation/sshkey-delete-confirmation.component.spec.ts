import { Router } from '@angular/router';
import { of } from 'rxjs';
import { SharedModule } from './../../shared/shared.module';
import { HttpClientModule } from '@angular/common/http';
import { SlimLoadingBarModule } from 'ng2-slim-loading-bar';
import { BrowserModule, By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { async, ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { RouterStub, RouterTestingModule } from './../../testing/router-stubs';
import { MatDialogRefMock } from './../../testing/services/mat-dialog-ref-mock';
import { ApiService } from '../../core/services/api/api.service';
import { ApiMockService } from '../../testing/services/api-mock.service';
import { MatDialogRef } from '@angular/material';
import { SSHKeyDeleteConfirmationComponent } from './sshkey-delete-confirmation.component';
import { fakeProject } from '../../testing/fake-data/project.fake';
import { fakeSSHKeys } from '../../testing/fake-data/sshkey.fake';

const modules: any[] = [
  BrowserModule,
  HttpClientModule,
  BrowserAnimationsModule,
  SlimLoadingBarModule.forRoot(),
  RouterTestingModule,
  SharedModule
];

describe('SSHKeyDeleteConfirmationComponent', () => {
  let fixture: ComponentFixture<SSHKeyDeleteConfirmationComponent>;
  let component: SSHKeyDeleteConfirmationComponent;
  let apiService: ApiService;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        ...modules,
      ],
      declarations: [
        SSHKeyDeleteConfirmationComponent
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
    router = fixture.debugElement.injector.get(Router);
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
