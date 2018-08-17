import { SharedModule } from '../shared/shared.module';
import { SlimLoadingBarModule } from 'ng2-slim-loading-bar';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { async, ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { AddProjectComponent } from './add-project.component';
import { MatDialogRefMock } from '../testing/services/mat-dialog-ref-mock';
import { ProjectMockService } from '../testing/services/project-mock.service';
import { ApiService, ProjectService } from '../core/services';
import { asyncData } from '../testing/services/api-mock.service';
import { fakeDigitaloceanCluster } from '../testing/fake-data/cluster.fake';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import Spy = jasmine.Spy;

const modules: any[] = [
  BrowserModule,
  BrowserAnimationsModule,
  SlimLoadingBarModule.forRoot(),
  SharedModule
];

describe('AddProjectComponent', () => {
  let fixture: ComponentFixture<AddProjectComponent>;
  let component: AddProjectComponent;
  let createProjectSpy: Spy;

  beforeEach(async(() => {
    const apiMock = jasmine.createSpyObj('ApiService', ['createProject']);
    createProjectSpy = apiMock.createProject.and.returnValue(asyncData(fakeDigitaloceanCluster));

    TestBed.configureTestingModule({
      imports: [
        ...modules,
      ],
      declarations: [
        AddProjectComponent
      ],
      providers: [
        { provide: MatDialogRef, useClass: MatDialogRefMock },
        { provide: ApiService, useValue: apiMock },
        { provide: ProjectService, useClass: ProjectMockService },
      ],
    }).compileComponents();
  }));

  beforeEach(async(() => {
    fixture = TestBed.createComponent(AddProjectComponent);
    component = fixture.componentInstance;
  }));

  it('should create the add project component', async(() => {
    expect(component).toBeTruthy();
  }));
});
