import { AuthMockService } from './../../../testing/services/auth-mock.service';
import { HttpClientModule } from '@angular/common/http';
import { BrowserModule, By } from '@angular/platform-browser';
import { MockNgRedux, NgReduxTestingModule } from '@angular-redux/store/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BreadcrumbsComponent } from './breadcrumbs.component';
import { ApiService } from './../../services/api/api.service';
import { Auth } from '../../services/index';
import { ApiMockService } from '../../../testing/services/api-mock.service';

const modules: any[] = [
  BrowserModule,
  HttpClientModule,
  RouterTestingModule,
  NgReduxTestingModule,
  BrowserAnimationsModule
];

function setMockNgRedux<T>(fixture: ComponentFixture<T>, crumb: string): void {
  const appLoader = MockNgRedux.getSelectorStub(['breadcrumb', 'crumb']);
  appLoader.next(crumb);
  appLoader.complete();
}

describe('BreadcrumbsComponent', () => {
  let fixture: ComponentFixture<BreadcrumbsComponent>;
  let component: BreadcrumbsComponent;

  beforeEach(() => {
    MockNgRedux.reset();
    TestBed.configureTestingModule({
      imports: [
        ...modules,
      ],
      declarations: [
        BreadcrumbsComponent
      ],
      providers: [
        { provide: ApiService, useClass: ApiMockService },
        { provide: Auth, useClass: AuthMockService }
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BreadcrumbsComponent);
    component = fixture.componentInstance;
  });

  it('should create the Breadcrumbs', () => {
    expect(component).toBeTruthy();
  });

  it('should set activePageTitle', () => {
    setMockNgRedux(fixture, 'Manage Clusters');
    fixture.detectChanges();

    const crumb = component.activePageTitle;

    expect(crumb).toBe('Manage Clusters');
  });

  it('should render 2 breadcrumbs', () => {
    fixture.detectChanges();

    const de = fixture.debugElement.queryAll(By.css('.breadcrumb-item'));
    expect(de.length).toBe(2);
  });
});
