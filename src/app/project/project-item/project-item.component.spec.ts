import { Router } from '@angular/router';
import { MatDialogRef } from '@angular/material';
import { HttpClientModule } from '@angular/common/http';
import { BrowserModule, By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { async, ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { SlimLoadingBarModule } from 'ng2-slim-loading-bar';
import { ProjectService } from '../../core/services';
import { SharedModule } from '../../shared/shared.module';
import { RouterStub, RouterTestingModule } from '../../testing/router-stubs';
import { MatDialogRefMock } from '../../testing/services/mat-dialog-ref-mock';
import { ProjectMockService } from '../../testing/services/project-mock.service';
import { fakeDigitaloceanCluster } from '../../testing/fake-data/cluster.fake';
import { ProjectItemComponent } from './project-item.component';

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
        { provide: Router, useClass: RouterStub },
        { provide: MatDialogRef, useClass: MatDialogRefMock },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjectItemComponent);
    component = fixture.componentInstance;
  });

  it('should create project item cmp', () => {
    expect(component).toBeTruthy();
  });
});
