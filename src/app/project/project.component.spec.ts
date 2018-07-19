import { ApiService, DatacenterService, InitialNodeDataService } from '../core/services';
import { ProjectComponent } from './project.component';
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


describe('ProjectComponent', () => {
  let fixture: ComponentFixture<ProjectComponent>;
  let component: ProjectComponent;
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
        ProjectComponent,
      ],
      providers: [
        { provide: Router, useClass: RouterStub },
        MatDialog,
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    router = fixture.debugElement.injector.get(Router);
  });

  it('should create project cmp', () => {
    expect(component).toBeTruthy();
  });
});
