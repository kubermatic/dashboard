import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {MatDialogRef} from '@angular/material';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {SlimLoadingBarModule} from 'ng2-slim-loading-bar';
import {ApiService, ProjectService} from '../core/services';
import {SharedModule} from '../shared/shared.module';
import {fakeDigitaloceanCluster} from '../testing/fake-data/cluster.fake';
import {asyncData} from '../testing/services/api-mock.service';
import {MatDialogRefMock} from '../testing/services/mat-dialog-ref-mock';
import {ProjectMockService} from '../testing/services/project-mock.service';
import {AddProjectComponent} from './add-project.component';

const modules: any[] = [
  BrowserModule,
  BrowserAnimationsModule,
  SlimLoadingBarModule.forRoot(),
  SharedModule,
];

describe('AddProjectComponent', () => {
  let fixture: ComponentFixture<AddProjectComponent>;
  let component: AddProjectComponent;

  beforeEach(async(() => {
    const apiMock = jasmine.createSpyObj('ApiService', ['createProject']);
    apiMock.createProject.and.returnValue(asyncData(fakeDigitaloceanCluster));

    TestBed
        .configureTestingModule({
          imports: [
            ...modules,
          ],
          declarations: [
            AddProjectComponent,
          ],
          providers: [
            {provide: MatDialogRef, useClass: MatDialogRefMock},
            {provide: ApiService, useValue: apiMock},
            {provide: ProjectService, useClass: ProjectMockService},
          ],
        })
        .compileComponents();
  }));

  beforeEach(async(() => {
    fixture = TestBed.createComponent(AddProjectComponent);
    component = fixture.componentInstance;
  }));

  it('should create the add project component', async(() => {
       expect(component).toBeTruthy();
     }));
});
