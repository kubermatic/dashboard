import { SharedModule } from '../../../shared/shared.module';
import { SlimLoadingBarModule } from 'ng2-slim-loading-bar';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ClusterSecretsComponent } from './cluster-secrets.component';
import { ClusterService, ApiService } from '../../../core/services';
import { asyncData } from '../../../testing/services/api-mock.service';
import { fakeMetrics } from '../../../testing/fake-data/metrics.fake';
import Spy = jasmine.Spy;

const modules: any[] = [
  BrowserModule,
  BrowserAnimationsModule,
  SlimLoadingBarModule.forRoot(),
  SharedModule
];

describe('ClusterSecretsComponent', () => {
  let fixture: ComponentFixture<ClusterSecretsComponent>;
  let component: ClusterSecretsComponent;
  let getMetricsSpy: Spy;

  beforeEach(async(() => {
    const apiMock = jasmine.createSpyObj('ApiService', ['getMetrics']);
    getMetricsSpy = apiMock.getMetrics.and.returnValue(asyncData(fakeMetrics));

    TestBed.configureTestingModule({
      imports: [
        ...modules,
      ],
      declarations: [
        ClusterSecretsComponent
      ],
      providers: [
        ClusterService,
        { provide: ApiService, useValue: apiMock }
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ClusterSecretsComponent);
    component = fixture.componentInstance;
  });

  it('should create the cluster secrets cmp', async(() => {
    expect(component).toBeTruthy();
  }));
});
