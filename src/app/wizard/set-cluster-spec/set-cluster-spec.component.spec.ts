import {HttpClient, HttpClientModule} from '@angular/common/http';
import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {ReactiveFormsModule} from '@angular/forms';
import {BrowserModule, By} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';

import {CoreModule} from '../../core/core.module';
import {ApiService, WizardService} from '../../core/services';
import {ClusterNameGenerator} from '../../core/util/name-generator.service';
import {MachineNetworksModule} from '../../machine-networks/machine-networks.module';
import {ClusterTypeOptions} from '../../shared/entity/AdminSettings';
import {SharedModule} from '../../shared/shared.module';
import {masterVersionsFake} from '../../testing/fake-data/cluster-spec.fake';
import {asyncData} from '../../testing/services/api-mock.service';
import {ClusterNameGeneratorMock} from '../../testing/services/name-generator-mock.service';
import {DEFAULT_ADMIN_SETTINGS_MOCK} from '../../testing/services/settings-mock.service';

import {SetClusterSpecComponent} from './set-cluster-spec.component';

const modules: any[] = [
  BrowserModule,
  BrowserAnimationsModule,
  ReactiveFormsModule,
  SharedModule,
  MachineNetworksModule,
  HttpClientModule,
  CoreModule,
];

describe('SetClusterSpecComponent', () => {
  let fixture: ComponentFixture<SetClusterSpecComponent>;
  let component: SetClusterSpecComponent;
  let nameGenerator: ClusterNameGenerator;

  beforeEach(async(() => {
    const apiMock = {'getMasterVersions': jest.fn()};
    apiMock.getMasterVersions.mockReturnValue(asyncData(masterVersionsFake()));
    TestBed
        .configureTestingModule({
          imports: [
            ...modules,
          ],
          declarations: [
            SetClusterSpecComponent,
          ],
          providers: [
            HttpClient,
            WizardService,
            {provide: ApiService, useValue: apiMock},
            {provide: ClusterNameGenerator, useClass: ClusterNameGeneratorMock},
          ],
        })
        .compileComponents();
  }));

  const createComponent = () => {
    fixture = TestBed.createComponent(SetClusterSpecComponent);
    component = fixture.componentInstance;
    component.cluster = {
      name: '',
      spec: {
        version: '',
        cloud: {
          dc: '',
        },
        machineNetworks: [{
          cidr: '',
          dnsServers: [],
          gateway: '',
        }],
      },
      type: '',
    };
    component.labels = {};
    component.asyncLabelValidators = [];
    component.settings = DEFAULT_ADMIN_SETTINGS_MOCK;
    fixture.detectChanges();
    nameGenerator = fixture.debugElement.injector.get(ClusterNameGenerator);
  };

  beforeEach(createComponent);

  it('should create the set-cluster-spec cmp', () => {
    expect(component).toBeTruthy();
  });

  it('form invalid after creating', () => {
    expect(component.clusterSpecForm.valid).toBeFalsy();
  });

  it('name field validity', () => {
    const name = component.clusterSpecForm.controls.name;
    expect(name.hasError('required')).toBeTruthy();

    name.setValue('test-name');
    expect(name.hasError('required')).toBeFalsy();

    expect(component.clusterSpecForm.controls.name.valid).toBeTruthy();
  });

  it('should call generateName method', () => {
    const generatedName = 'generated-name';
    const spyGenerateName = jest.spyOn(nameGenerator, 'generateName').mockReturnValue(generatedName);
    fixture.detectChanges();

    component.generateName();
    fixture.detectChanges();

    const nameElement = fixture.debugElement.query(By.css('#km-create-cluster-name-input')).nativeElement;

    expect(spyGenerateName).toHaveBeenCalledTimes(1);
    expect(component.clusterSpecForm.controls['name'].value).toBe(generatedName);
    expect(nameElement.value).toBe(generatedName);
  });

  it('should show type toggle by default', () => {
    component.settings.clusterTypeOptions = ClusterTypeOptions.All;
    expect(component.hasMultipleTypes()).toBeTruthy();
  });

  it('should not show type toggle if type openshift is hidden', () => {
    component.settings.clusterTypeOptions = ClusterTypeOptions.Kubernetes;
    expect(component.hasMultipleTypes()).toBeFalsy();
  });

  it('should not show type toggle if type kubernetes is hidden', () => {
    component.settings.clusterTypeOptions = ClusterTypeOptions.OpenShift;
    expect(component.hasMultipleTypes()).toBeFalsy();
  });
});
