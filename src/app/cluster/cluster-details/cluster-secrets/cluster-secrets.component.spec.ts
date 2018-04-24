import { SharedModule } from '../../../shared/shared.module';
import { SlimLoadingBarModule } from 'ng2-slim-loading-bar';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ClusterSecretsComponent } from './cluster-secrets.component';
import { ClusterService } from '../../../core/services';

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
        ClusterService
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
