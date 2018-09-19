import { SlimLoadingBarModule } from 'ng2-slim-loading-bar';
import { MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { async, ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { EditSSHKeyDeleteConfirmationComponent } from './edit-sshkey-delete-confirmation.component';
import { ApiService } from './../../../../core/services';
import { SharedModule } from './../../../../shared/shared.module';
import { MatDialogRefMock } from './../../../../testing/services/mat-dialog-ref-mock';
import { asyncData } from './../../../../testing/services/api-mock.service';
import Spy = jasmine.Spy;

const modules: any[] = [
  BrowserModule,
  BrowserAnimationsModule,
  SlimLoadingBarModule.forRoot(),
  SharedModule
];

describe('EditSSHKeyDeleteConfirmationComponent', () => {
  let fixture: ComponentFixture<EditSSHKeyDeleteConfirmationComponent>;
  let component: EditSSHKeyDeleteConfirmationComponent;
  let deleteClusterSSHKey: Spy;

  beforeEach(async(() => {
    const apiMock = jasmine.createSpyObj('ApiService', ['deleteClusterSSHKey']);
    deleteClusterSSHKey = apiMock.deleteClusterSSHKey.and.returnValue(asyncData(null));

    TestBed.configureTestingModule({
      imports: [
        ...modules,
      ],
      declarations: [
        EditSSHKeyDeleteConfirmationComponent
      ],
      providers: [
        { provide: MatDialogRef, useClass: MatDialogRefMock },
        { provide: ApiService, useValue: apiMock }
      ],
    }).compileComponents();
  }));

  beforeEach(async(() => {
    fixture = TestBed.createComponent(EditSSHKeyDeleteConfirmationComponent);
    component = fixture.componentInstance;
  }));

  it('should create the edit sshkey delete confirmation component', async(() => {
    expect(component).toBeTruthy();
  }));
});
