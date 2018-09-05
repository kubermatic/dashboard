import { BrowserModule } from '@angular/platform-browser';
import { MatDialog } from '@angular/material';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { SlimLoadingBarModule } from 'ng2-slim-loading-bar';
import { ClusterSecretsComponent } from './cluster-secrets.component';
import { HealthService } from '../../../core/services';
import { AppConfigService } from '../../../app-config.service';
import { SharedModule } from '../../../shared/shared.module';
import { HealthMockService } from '../../../testing/services/health-mock.service';
import { AppConfigMockService } from '../../../testing/services/app-config-mock.service';

const modules: any[] = [
  BrowserModule,
  BrowserAnimationsModule,
  SlimLoadingBarModule.forRoot(),
  SharedModule
];

describe('ClusterSecretsComponent', () => {
  let fixture: ComponentFixture<ClusterSecretsComponent>;
  let component: ClusterSecretsComponent;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        ...modules,
      ],
      declarations: [
        ClusterSecretsComponent
      ],
      providers: [
        { provide: HealthService, useClass: HealthMockService },
        { provide: AppConfigService, useClass: AppConfigMockService },
        MatDialog
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
