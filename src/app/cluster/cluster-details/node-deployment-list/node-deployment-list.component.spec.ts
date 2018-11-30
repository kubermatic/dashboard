import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {MatDialog} from '@angular/material';
import {BrowserModule, By} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {SlimLoadingBarModule} from 'ng2-slim-loading-bar';
import {AppConfigService} from '../../../app-config.service';
import {UserService} from '../../../core/services';
import {SharedModule} from '../../../shared/shared.module';
import {AppConfigMockService} from '../../../testing/services/app-config-mock.service';
import {UserMockService} from '../../../testing/services/user-mock.service';
import {NodeDeploymentListComponent} from './node-deployment-list.component';

const modules: any[] = [
  BrowserModule,
  BrowserAnimationsModule,
  SlimLoadingBarModule.forRoot(),
  SharedModule,
];

describe('NodeComponent', () => {
  let fixture: ComponentFixture<NodeDeploymentListComponent>;
  let component: NodeDeploymentListComponent;

  beforeEach(async(() => {
    TestBed
        .configureTestingModule({
          imports: [
            ...modules,
          ],
          declarations: [
            NodeDeploymentListComponent,
          ],
          providers: [
            {provide: UserService, useClass: UserMockService},
            {provide: AppConfigService, useClass: AppConfigMockService},
            MatDialog,
          ],
        })
        .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NodeDeploymentListComponent);
    component = fixture.componentInstance;
  });

  it('should create the cluster details cmp', async(() => {
       expect(component).toBeTruthy();
     }));
});
