import { SharedModule } from '../../shared/shared.module';
import { HttpClientModule } from '@angular/common/http';
import { SlimLoadingBarModule } from 'ng2-slim-loading-bar';
import { BrowserModule, By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { async, ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { RouterTestingModule } from '../../testing/router-stubs';
import { ProjectItemComponent } from './project-item.component';
import { Auth, ProjectService } from '../../core/services';
import { AuthMockService } from '../../testing/services/auth-mock.service';
import { ProjectMockService } from '../../testing/services/project-mock.service';
import { fakeDigitaloceanCluster } from '../../testing/fake-data/cluster.fake';
import { ApiService} from '../../core/services';


const modules: any[] = [
  BrowserModule,
  HttpClientModule,
  BrowserAnimationsModule,
  SlimLoadingBarModule.forRoot(),
  RouterTestingModule,
  SharedModule
];

describe('ProjectItemComponent', () => {
  let fixture: ComponentFixture<ProjectItemComponent>;
  let component: ProjectItemComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        ...modules,
      ],
      declarations: [
        ProjectItemComponent,
      ],
      providers: [
        { provide: ProjectService, useClass: ProjectMockService },
        { provide: Auth, useClass: AuthMockService },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjectItemComponent);
    component = fixture.componentInstance;
  });
});
