import { HttpClientModule } from '@angular/common/http';
import { BrowserModule, By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { async, ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { SlimLoadingBarModule } from 'ng2-slim-loading-bar';
import { MemberItemComponent } from './member-item.component';
import { ProjectService } from '../../core/services';
import { SharedModule } from '../../shared/shared.module';
import { RouterTestingModule } from '../../testing/router-stubs';
import { ProjectMockService } from '../../testing/services/project-mock.service';
import { fakeDigitaloceanCluster } from '../../testing/fake-data/cluster.fake';


const modules: any[] = [
  BrowserModule,
  HttpClientModule,
  BrowserAnimationsModule,
  SlimLoadingBarModule.forRoot(),
  RouterTestingModule,
  SharedModule
];

describe('MemberItemComponent', () => {
  let fixture: ComponentFixture<MemberItemComponent>;
  let component: MemberItemComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        ...modules,
      ],
      declarations: [
        MemberItemComponent,
      ],
      providers: [
        { provide: ProjectService, useClass: ProjectMockService },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MemberItemComponent);
    component = fixture.componentInstance;
  });

  it('should create member item cmp', () => {
    expect(component).toBeTruthy();
  });
});
