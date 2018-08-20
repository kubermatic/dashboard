import { ApiService } from '../core/services';
import { ApiMockService } from '../testing/services/api-mock.service';
import { MemberComponent } from './member.component';
import { Router } from '@angular/router';
import { SharedModule } from '../shared/shared.module';
import { SlimLoadingBarModule } from 'ng2-slim-loading-bar';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '../testing/router-stubs';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterStub } from './../testing/router-stubs';
import { asyncData } from '../testing/services/api-mock.service';
import { MatTabsModule, MatDialog } from '@angular/material';


describe('MemberComponent', () => {
  let fixture: ComponentFixture<MemberComponent>;
  let component: MemberComponent;
  let router: Router;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        BrowserModule,
        BrowserAnimationsModule,
        SlimLoadingBarModule.forRoot(),
        RouterTestingModule,
        SharedModule,
        MatTabsModule,
      ],
      declarations: [
        MemberComponent
      ],
      providers: [
        { provide: Router, useClass: RouterStub },
        { provide: ApiService, useClass: ApiMockService },
        MatDialog,
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MemberComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    router = fixture.debugElement.injector.get(Router);
  });

  it('should create members cmp', () => {
    expect(component).toBeTruthy();
  });
});
