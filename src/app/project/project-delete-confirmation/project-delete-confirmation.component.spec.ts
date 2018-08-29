import { Router } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { SharedModule } from './../../shared/shared.module';
import { HttpClientModule } from '@angular/common/http';
import { SlimLoadingBarModule } from 'ng2-slim-loading-bar';
import { BrowserModule, By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { async, ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { RouterStub, RouterTestingModule } from './../../testing/router-stubs';

import { MatDialogRefMock } from './../../testing/services/mat-dialog-ref-mock';
import { ApiService } from '../../core/services/api/api.service';
import { ApiMockService } from '../../testing/services/api-mock.service';
import { MatDialogRef } from '@angular/material';
import { ProjectDeleteConfirmationComponent } from './project-delete-confirmation.component';
import { fakeProject } from '../../testing/fake-data/project.fake';

const modules: any[] = [
  BrowserModule,
  HttpClientModule,
  BrowserAnimationsModule,
  SlimLoadingBarModule.forRoot(),
  RouterTestingModule,
  SharedModule
];

describe('ProjectDeleteConfirmationComponent', () => {
  let fixture: ComponentFixture<ProjectDeleteConfirmationComponent>;
  let component: ProjectDeleteConfirmationComponent;
  let apiService: ApiService;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        ...modules,
      ],
      declarations: [
        ProjectDeleteConfirmationComponent
      ],
      providers: [
        { provide: MatDialogRef, useClass: MatDialogRefMock },
        { provide: ApiService, useClass: ApiMockService },
        { provide: Router, useClass: RouterStub },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjectDeleteConfirmationComponent);
    component = fixture.componentInstance;

    apiService = fixture.debugElement.injector.get(ApiService);
    router = fixture.debugElement.injector.get(Router);
  });

  it('should create the add node modal cmp', async(() => {
    expect(component).toBeTruthy();
  }));

  it('should able add button', () => {
    component.project = fakeProject();

    fixture.detectChanges();

    const input = fixture.debugElement.query(By.css('#name'));
    const inputElement = input.nativeElement;
    inputElement.value = fakeProject().name;
    inputElement.dispatchEvent(new Event('blur'));

    expect(component.inputNameMatches()).toBeTruthy();
  });

  it('should call deleteProject method', fakeAsync(() => {
    component.project = fakeProject();
    component.inputName = fakeProject().name;

    fixture.detectChanges();
    const spyDeleteProject = spyOn(apiService, 'deleteProject').and.returnValue(Observable.of(null));

    component.deleteProject();
    tick();

    expect(spyDeleteProject.and.callThrough()).toHaveBeenCalled();
  }));
});
