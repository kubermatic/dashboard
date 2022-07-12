import {MatDialogModule, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {TestBed, ComponentFixture} from '@angular/core/testing';
import {BrowserModule} from '@angular/platform-browser';
import {ChangeDetectorRef} from '@angular/core';

import {of} from 'rxjs';

import {ProjectService} from '@core/services/project';
import {QuotaService} from '@core/services/quota';
import {UserService} from '@core/services/user';

import {Project} from '@shared/entity/project';
import {SharedModule} from '@shared/module';

import {ChangeDetectorRefServiceMock} from '@test/services/change-detector-ref-mock';
import {MatDialogRefMock} from '@test/services/mat-dialog-ref-mock';
import {ProjectMockService} from '@test/services/project-mock';
import {QuotasMock, QuotaMock} from '@test/data/quotas.mock';
import {QuotaServiceMock} from '@test/services/quota-mock';
import {UserMockService} from '@test/services/user-mock';
import {fakeProjects} from '@test/data/project';

import {ProjectQuotaDialogComponent} from './component';

describe('AddProjectQuotaDialogComponent', () => {
  let fixture: ComponentFixture<ProjectQuotaDialogComponent>;
  let component: ProjectQuotaDialogComponent;

  let projectsService: ProjectService;

  let mockProjects: Project[];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ProjectQuotaDialogComponent],
      imports: [BrowserModule, NoopAnimationsModule, SharedModule, MatDialogModule],
      providers: [
        {provide: ChangeDetectorRef, useClass: ChangeDetectorRefServiceMock},
        {provide: QuotaService, useClass: QuotaServiceMock},
        {provide: UserService, useClass: UserMockService},
        {provide: ProjectService, useClass: ProjectMockService},
        {provide: MatDialogRef, useClass: MatDialogRefMock},
        {provide: MAT_DIALOG_DATA, useValue: {}},
      ],
    }).compileComponents();
  });

  beforeEach(async () => {
    fixture = TestBed.createComponent(ProjectQuotaDialogComponent);
    component = fixture.componentInstance;

    projectsService = TestBed.inject(ProjectService);
    mockProjects = fakeProjects();

    fixture.detectChanges();
  });

  it('should initialize', async () => {
    expect(component).toBeTruthy();
  });

  it('should have correct label on submit button when adding quota', async () => {
    component.selectedQuota = null;
    fixture.detectChanges();

    const element = fixture.debugElement.nativeElement.querySelector('#km-add-quota-dialog-save-btn');

    expect(element.textContent.trim()).toEqual('Add Project Quota');
  });

  it('should have correct label on submit button when updating quota', async () => {
    component.selectedQuota = QuotaMock;
    fixture.detectChanges();

    const element = fixture.debugElement.nativeElement.querySelector('#km-add-quota-dialog-save-btn');

    expect(element.textContent.trim()).toEqual('Update Project Quota');
  });

  it('should disable submit button when form is invalid', async () => {
    jest.spyOn(component.form, 'invalid', 'get').mockReturnValue(true);
    fixture.detectChanges();

    const element = fixture.debugElement.nativeElement.querySelector('#km-add-quota-dialog-save-btn > button');

    expect(element.disabled).toEqual(true);
  });

  it('should enable submit button when form is valid', async () => {
    jest.spyOn(component.form, 'invalid', 'get').mockReturnValue(false);
    fixture.detectChanges();

    const element = fixture.debugElement.nativeElement.querySelector('#km-add-quota-dialog-save-btn > button');

    expect(element.disabled).toEqual(false);
  });

  it('should call _getProjects() when ngOnInit() is called', async () => {
    // @ts-ignore
    const spy = jest.spyOn(component, '_getProjects');

    component.ngOnInit();

    expect(spy).toHaveBeenCalled();
  });

  it('should call _getQuotas() when ngOnInit() is called', async () => {
    // @ts-ignore
    const spy = jest.spyOn(component, '_getQuotas');

    component.ngOnInit();

    expect(spy).toHaveBeenCalled();
  });

  it('should call _initForm() when ngOnInit() is called', async () => {
    // @ts-ignore
    const spy = jest.spyOn(component, '_initForm');

    component.ngOnInit();

    expect(spy).toHaveBeenCalled();
  });

  it('should call _subscribeToSubjectNameChanges() when _initForm() is called', async () => {
    // @ts-ignore
    const spy = jest.spyOn(component, '_subscribeToSubjectNameChanges');

    // @ts-ignore
    component._initForm();

    expect(spy).toHaveBeenCalled();
  });

  it('should call next() on _unsubscribe when ngOnDestroy() is called', async () => {
    // @ts-ignore
    const spy = jest.spyOn(component._unsubscribe, 'next');

    component.ngOnDestroy();

    expect(spy).toHaveBeenCalled();
  });

  it('should call complete() on _unsubscribe when ngOnDestroy() is called', async () => {
    // @ts-ignore
    const spy = jest.spyOn(component._unsubscribe, 'complete');

    component.ngOnDestroy();

    expect(spy).toHaveBeenCalled();
  });

  it('should call complete() on _unsubscribe when ngOnDestroy() is called', async () => {
    // @ts-ignore
    const spy = jest.spyOn(component._unsubscribe, 'complete');

    component.ngOnDestroy();

    expect(spy).toHaveBeenCalled();
  });

  it('should call subscribe() on allProjects in _projectsService', async () => {
    jest.spyOn(projectsService, 'allProjects', 'get').mockReturnValue(of(mockProjects));
    const spy = jest.spyOn(projectsService.allProjects, 'subscribe');

    // @ts-ignore
    component._getProjects();

    expect(spy).toHaveBeenCalled();
  });

  it('should set projects when subscribed to myProjects in _projectService', async () => {
    jest.spyOn(projectsService, 'allProjects', 'get').mockReturnValue(of(mockProjects));
    component.projects = [];

    // @ts-ignore
    component._getProjects();

    expect(component.projects).toEqual(mockProjects);
  });

  it('should should set quotas when subscribed to quotas in _quotaService', async () => {
    component.quotas = [];

    // @ts-ignore
    component._getQuotas();

    expect(component.quotas).toEqual(QuotasMock);
  });

  it('should create form when _initForm() is called', async () => {
    component.form = null;

    // @ts-ignore
    component._initForm();

    expect(component.form).toBeTruthy();
  });
});
