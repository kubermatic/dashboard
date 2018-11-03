import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { SlimLoadingBarModule } from 'ng2-slim-loading-bar';
import { ApiService } from './../../../../core/services';
import { SharedModule } from './../../../../shared/shared.module';
import { asyncData } from './../../../../testing/services/api-mock.service';
import { MatDialogRefMock } from './../../../../testing/services/mat-dialog-ref-mock';
import { EditSSHKeyDeleteConfirmationComponent } from './edit-sshkey-delete-confirmation.component';

const modules: any[] = [
  BrowserModule,
  BrowserAnimationsModule,
  SlimLoadingBarModule.forRoot(),
  SharedModule,
];

describe('EditSSHKeyDeleteConfirmationComponent', () => {
  let fixture: ComponentFixture<EditSSHKeyDeleteConfirmationComponent>;
  let component: EditSSHKeyDeleteConfirmationComponent;

  beforeEach(async(() => {
    const apiMock = jasmine.createSpyObj('ApiService', ['deleteClusterSSHKey']);
    apiMock.deleteClusterSSHKey.and.returnValue(asyncData(null));

    TestBed.configureTestingModule({
      imports: [
        ...modules,
      ],
      declarations: [
        EditSSHKeyDeleteConfirmationComponent,
      ],
      providers: [
        { provide: MatDialogRef, useClass: MatDialogRefMock },
        { provide: ApiService, useValue: apiMock },
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
