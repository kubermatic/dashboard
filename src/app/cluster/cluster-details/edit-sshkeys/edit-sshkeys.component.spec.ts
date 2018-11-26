import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {MatDialog} from '@angular/material';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {SlimLoadingBarModule} from 'ng2-slim-loading-bar';
import {AppConfigService} from '../../../app-config.service';
import {ApiService, UserService} from '../../../core/services';
import {SharedModule} from '../../../shared/shared.module';
import {fakeSSHKeys} from '../../../testing/fake-data/sshkey.fake';
import {asyncData} from '../../../testing/services/api-mock.service';
import {AppConfigMockService} from '../../../testing/services/app-config-mock.service';
import {UserMockService} from '../../../testing/services/user-mock.service';
import {EditSSHKeysItemComponent} from './edit-sshkeys-item/edit-sshkeys-item.component';
import {EditSSHKeysComponent} from './edit-sshkeys.component';

const modules: any[] = [
  BrowserModule,
  BrowserAnimationsModule,
  SlimLoadingBarModule.forRoot(),
  SharedModule,
];

describe('EditSSHKeysComponent', () => {
  let fixture: ComponentFixture<EditSSHKeysComponent>;
  let component: EditSSHKeysComponent;

  beforeEach(async(() => {
    const apiMock = jasmine.createSpyObj('ApiService', ['getClusterSSHKeys']);
    apiMock.getClusterSSHKeys.and.returnValue(asyncData(fakeSSHKeys()));

    TestBed
        .configureTestingModule({
          imports: [
            ...modules,
          ],
          declarations: [
            EditSSHKeysComponent,
            EditSSHKeysItemComponent,
          ],
          providers: [
            {provide: ApiService, useValue: apiMock},
            {provide: UserService, useClass: UserMockService},
            {provide: AppConfigService, useClass: AppConfigMockService},
            MatDialog,
          ],
        })
        .compileComponents();
  }));

  beforeEach(async(() => {
    fixture = TestBed.createComponent(EditSSHKeysComponent);
    component = fixture.componentInstance;
  }));

  it('should create the edit sshkeys component', async(() => {
       expect(component).toBeTruthy();
     }));
});
