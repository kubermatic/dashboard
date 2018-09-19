import { SlimLoadingBarModule } from 'ng2-slim-loading-bar';
import { MatDialog, MAT_DIALOG_DATA } from '@angular/material';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { async, ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { EditSSHKeysComponent } from './edit-sshkeys.component';
import { EditSSHKeysItemComponent } from './edit-sshkeys-item/edit-sshkeys-item.component';
import { ApiService, UserService } from './../../../core/services';
import { AppConfigService } from './../../../app-config.service';
import { SharedModule } from './../../../shared/shared.module';
import { UserMockService } from './../../../testing/services/user-mock.service';
import { AppConfigMockService } from './../../../testing/services/app-config-mock.service';
import { asyncData } from './../../../testing/services/api-mock.service';
import { fakeSSHKeys } from './../../../testing/fake-data/sshkey.fake';
import Spy = jasmine.Spy;

const modules: any[] = [
  BrowserModule,
  BrowserAnimationsModule,
  SlimLoadingBarModule.forRoot(),
  SharedModule
];

describe('EditSSHKeysComponent', () => {
  let fixture: ComponentFixture<EditSSHKeysComponent>;
  let component: EditSSHKeysComponent;
  let getClusterSSHKeys: Spy;

  beforeEach(async(() => {
    const apiMock = jasmine.createSpyObj('ApiService', ['getClusterSSHKeys']);
    getClusterSSHKeys = apiMock.getClusterSSHKeys.and.returnValue(asyncData(fakeSSHKeys()));

    TestBed.configureTestingModule({
      imports: [
        ...modules,
      ],
      declarations: [
        EditSSHKeysComponent,
        EditSSHKeysItemComponent
      ],
      providers: [
        { provide: ApiService, useValue: apiMock },
        { provide: UserService, useClass: UserMockService },
        { provide: AppConfigService, useClass: AppConfigMockService},
        MatDialog
      ],
    }).compileComponents();
  }));

  beforeEach(async(() => {
    fixture = TestBed.createComponent(EditSSHKeysComponent);
    component = fixture.componentInstance;
  }));

  it('should create the edit sshkeys component', async(() => {
    expect(component).toBeTruthy();
  }));
});
