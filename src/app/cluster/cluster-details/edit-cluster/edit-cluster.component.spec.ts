import {async, ComponentFixture, fakeAsync, TestBed, tick} from '@angular/core/testing';
import {MatDialogRef} from '@angular/material';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {SlimLoadingBarModule} from 'ng2-slim-loading-bar';
import Spy = jasmine.Spy;
import {SharedModule} from '../../../shared/shared.module';
import {fakeProject} from '../../../testing/fake-data/project.fake';
import {asyncData} from '../../../testing/services/api-mock.service';
import {MatDialogRefMock} from '../../../testing/services/mat-dialog-ref-mock';
import {fakeAWSCluster} from '../../../testing/fake-data/cluster.fake';
import {EditClusterComponent} from './edit-cluster.component';
import {ClusterService} from '../../../core/services';
import {fakeAWSDatacenter} from '../../../testing/fake-data/datacenter.fake';
import {Subject} from 'rxjs';
import {CoreModule} from '../../../core/core.module';

const modules: any[] = [
  BrowserModule,
  BrowserAnimationsModule,
  SlimLoadingBarModule.forRoot(),
  SharedModule,
  CoreModule,
];

describe('EditClusterComponent', () => {
  let fixture: ComponentFixture<EditClusterComponent>;
  let component: EditClusterComponent;
  let editClusterSpy: Spy;

  beforeEach(async(() => {
    const clusterServiceMock = jasmine.createSpyObj('ClusterService', ['patch']);
    clusterServiceMock.onClusterUpdate = new Subject<void>();
    editClusterSpy = clusterServiceMock.patch.and.returnValue(asyncData(fakeAWSCluster()));

    TestBed
        .configureTestingModule({
          imports: [
            ...modules,
          ],
          declarations: [
            EditClusterComponent,
          ],
          providers: [
            {provide: MatDialogRef, useClass: MatDialogRefMock},
            {provide: ClusterService, useValue: clusterServiceMock},
          ],
        })
        .compileComponents();
  }));

  beforeEach(async(() => {
    fixture = TestBed.createComponent(EditClusterComponent);
    component = fixture.componentInstance;
    component.cluster = fakeAWSCluster();
    component.datacenter = fakeAWSDatacenter();
    component.projectID = fakeProject().id;
    fixture.detectChanges();
  }));

  it('should create the edit cluster component', async(() => {
       expect(component).toBeTruthy();
     }));

  it('should have valid form after creating', () => {
    expect(component.form.valid).toBeTruthy();
  });

  it('should have required fields', () => {
    component.form.controls.name.patchValue('');
    expect(component.form.valid).toBeFalsy('form is not valid');
    expect(component.form.controls.name.valid).toBeFalsy('name field is not valid');
    expect(component.form.controls.name.hasError('required')).toBeTruthy('name field has required error');

    component.form.controls.name.patchValue('new-cluster-name');
    expect(component.form.controls.name.hasError('required'))
        .toBeFalsy('name field has no required error after setting name');
  });

  it('should call editCluster method', fakeAsync(() => {
       component.form.controls.name.patchValue('new-cluster-name');
       component.editCluster();
       tick();

       expect(editClusterSpy.and.callThrough()).toHaveBeenCalled();
     }));
});
