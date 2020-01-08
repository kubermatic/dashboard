import {async, ComponentFixture, fakeAsync, TestBed, tick} from '@angular/core/testing';
import {MatDialogRef} from '@angular/material';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {Router} from '@angular/router';
import {CoreModule} from '../../../core/core.module';
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
  SharedModule,
  CoreModule,
];

describe('AddProjectDialogComponent', () => {
  let fixture: ComponentFixture<AddProjectDialogComponent>;
  let component: AddProjectDialogComponent;
  let createProjectSpy;

  beforeEach(async(() => {
    const apiMock = {'createProject': jest.fn()};
    createProjectSpy = apiMock.createProject.mockReturnValue(asyncData(fakeDigitaloceanCluster));

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
    component.labels = {};
    component.asyncLabelValidators = [];
    fixture.detectChanges();
  }));

  it('should create the add project component', async(() => {
       expect(component).toBeTruthy();
     }));

  it('should call createProject method', fakeAsync(() => {
       component.form.controls.name.patchValue('new-project-name');
       component.addProject();
       tick();

       expect(createProjectSpy).toHaveBeenCalled();
     }));
});
