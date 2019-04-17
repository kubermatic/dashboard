import {async, ComponentFixture, fakeAsync, TestBed, tick} from '@angular/core/testing';
import {MatDialogRef} from '@angular/material';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {Router} from '@angular/router';
import {SlimLoadingBarModule} from 'ng2-slim-loading-bar';
import Spy = jasmine.Spy;

import {ApiService, ProjectService} from '../../../core/services';
import {fakeDigitaloceanCluster} from '../../../testing/fake-data/cluster.fake';
import {RouterStub} from '../../../testing/router-stubs';
import {asyncData} from '../../../testing/services/api-mock.service';
import {MatDialogRefMock} from '../../../testing/services/mat-dialog-ref-mock';
import {ProjectMockService} from '../../../testing/services/project-mock.service';
import {SharedModule} from '../../shared.module';

import {AddProjectDialogComponent} from './add-project-dialog.component';

const modules: any[] = [
  BrowserModule,
  BrowserAnimationsModule,
  SlimLoadingBarModule.forRoot(),
  SharedModule,
];

describe('AddProjectDialogComponent', () => {
  let fixture: ComponentFixture<AddProjectDialogComponent>;
  let component: AddProjectDialogComponent;
  let createProjectSpy: Spy;

  beforeEach(async(() => {
    const apiMock = jasmine.createSpyObj('ApiService', ['createProject']);
    createProjectSpy = apiMock.createProject.and.returnValue(asyncData(fakeDigitaloceanCluster));

    TestBed
        .configureTestingModule({
          imports: [
            ...modules,
          ],
          providers: [
            {provide: MatDialogRef, useClass: MatDialogRefMock},
            {provide: ApiService, useValue: apiMock},
            {provide: ProjectService, useClass: ProjectMockService},
            {provide: Router, useClass: RouterStub},
          ],
        })
        .compileComponents();
  }));

  beforeEach(async(() => {
    fixture = TestBed.createComponent(AddProjectDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create the add project component', async(() => {
       expect(component).toBeTruthy();
     }));

  it('should call createProject method', fakeAsync(() => {
       component.addProjectForm.controls.name.patchValue('new-project-name');
       component.addProject();
       tick();

       expect(createProjectSpy.and.callThrough()).toHaveBeenCalled();
     }));
});
