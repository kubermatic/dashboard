import {async, ComponentFixture, fakeAsync, TestBed, tick} from '@angular/core/testing';
import {MatDialog} from '@angular/material';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {Router} from '@angular/router';
import {SlimLoadingBarModule} from 'ng2-slim-loading-bar';

import {AppConfigService} from '../app-config.service';
import {ClusterService, DatacenterService, ProjectService, UserService} from '../core/services';
import {GoogleAnalyticsService} from '../google-analytics.service';
import {SharedModule} from '../shared/shared.module';
import {DialogTestModule, NoopConfirmDialogComponent} from '../testing/components/noop-confirmation-dialog.component';
import {fakeProject} from '../testing/fake-data/project.fake';
import {RouterStub, RouterTestingModule} from '../testing/router-stubs';
import {AppConfigMockService} from '../testing/services/app-config-mock.service';
import {ClusterMockService} from '../testing/services/cluster-mock-service';
import {DatacenterMockService} from '../testing/services/datacenter-mock.service';
import {ProjectMockService} from '../testing/services/project-mock.service';
import {UserMockService} from '../testing/services/user-mock.service';
import {ProjectComponent} from './project.component';


describe('ProjectComponent', () => {
  let fixture: ComponentFixture<ProjectComponent>;
  let component: ProjectComponent;
  let noop: ComponentFixture<NoopConfirmDialogComponent>;

  beforeEach(async(() => {
    TestBed
        .configureTestingModule({
          imports: [
            BrowserModule,
            BrowserAnimationsModule,
            SlimLoadingBarModule.forRoot(),
            RouterTestingModule,
            SharedModule,
            DialogTestModule,
          ],
          declarations: [ProjectComponent],
          providers: [
            {provide: Router, useClass: RouterStub},
            {provide: ClusterService, useClass: ClusterMockService},
            {provide: ProjectService, useClass: ProjectMockService},
            {provide: UserService, useClass: UserMockService},
            {provide: AppConfigService, useClass: AppConfigMockService},
            {provide: DatacenterService, useClass: DatacenterMockService},
            MatDialog,
            GoogleAnalyticsService,
          ],
        })
        .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjectComponent);
    component = fixture.componentInstance;
    noop = TestBed.createComponent(NoopConfirmDialogComponent);
    fixture.detectChanges();
    fixture.debugElement.injector.get(Router);
  });

  it('should initialize', () => {
    expect(component).toBeTruthy();
  });

  it('should open delete project confirmation dialog & call deleteProject()', fakeAsync(() => {
       const project = fakeProject();
       const event = new MouseEvent('click');

       component.deleteProject(project, event);
       noop.detectChanges();
       fixture.detectChanges();
       tick(15000);

       const dialogTitle = document.body.querySelector('.mat-dialog-title');
       const deleteButton = document.body.querySelector('#km-confirmation-dialog-confirm-btn') as HTMLInputElement;
       const dialogInput = document.querySelector('#km-confirmation-dialog-input');

       dialogInput.setAttribute('value', project.name);
       deleteButton.disabled = false;

       noop.detectChanges();
       fixture.detectChanges();

       expect(dialogTitle.textContent).toBe('Delete Project');
       expect(document.querySelector('#km-confirmation-dialog-input').getAttribute('value')).toBe(project.name);

       deleteButton.click();

       noop.detectChanges();
       fixture.detectChanges();
       tick(15000);
     }));
});
