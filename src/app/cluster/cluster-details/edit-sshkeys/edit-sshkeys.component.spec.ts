import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {MatDialog} from '@angular/material';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {SlimLoadingBarModule} from 'ng2-slim-loading-bar';
import {AppConfigService} from '../../../app-config.service';
import {ClusterService, UserService} from '../../../core/services';
import {SharedModule} from '../../../shared/shared.module';
import {AppConfigMockService} from '../../../testing/services/app-config-mock.service';
import {ClusterMockService} from '../../../testing/services/cluster-mock-service';
import {UserMockService} from '../../../testing/services/user-mock.service';
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
    TestBed
        .configureTestingModule({
          imports: [
            ...modules,
          ],
          declarations: [
            EditSSHKeysComponent,
          ],
          providers: [
            {provide: ClusterService, useClass: ClusterMockService},
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
