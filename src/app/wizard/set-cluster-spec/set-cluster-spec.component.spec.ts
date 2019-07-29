import {HttpClient, HttpClientModule} from '@angular/common/http';
import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {ReactiveFormsModule} from '@angular/forms';
import {BrowserModule, By} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';

import {AppConfigService} from '../../app-config.service';
import {ApiService, WizardService} from '../../core/services';
import {ClusterNameGenerator} from '../../core/util/name-generator.service';
import {MachineNetworksModule} from '../../machine-networks/machine-networks.module';
import {Config} from '../../shared/model/Config';
import {SharedModule} from '../../shared/shared.module';
import {ClusterType} from '../../shared/utils/cluster-utils/cluster-utils';
import {fakeAppConfig} from '../../testing/fake-data/appConfig.fake';
import {masterVersionsFake} from '../../testing/fake-data/cluster-spec.fake';
import {asyncData} from '../../testing/services/api-mock.service';
import {ClusterNameGeneratorMock} from '../../testing/services/name-generator-mock.service';

import {SetClusterSpecComponent} from './set-cluster-spec.component';

const modules: any[] = [
  BrowserModule,
  BrowserAnimationsModule,
  ReactiveFormsModule,
  SharedModule,
  MachineNetworksModule,
  HttpClientModule,
];

describe('SetClusterSpecComponent', () => {
  let fixture: ComponentFixture<SetClusterSpecComponent>;
  let component: SetClusterSpecComponent;
  let nameGenerator: ClusterNameGenerator;
  let config: Config;

  beforeEach(async(() => {
    const apiMock = jasmine.createSpyObj('ApiService', ['getMasterVersions']);
    apiMock.getMasterVersions.and.returnValue(asyncData(masterVersionsFake()));
    const appConfigServiceMock = jasmine.createSpyObj('AppConfigService', ['getConfig']);
    config = fakeAppConfig() as Config;
    appConfigServiceMock.getConfig.and.returnValue(config);
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
            {provide: AppConfigService, useValue: appConfigServiceMock},
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
    expect(name.hasError('required')).toBeTruthy('name field has required error');

    name.setValue('test-name');
    expect(name.hasError('required')).toBeFalsy('name field has no required error');

    expect(component.clusterSpecForm.valid).toBeTruthy('form is valid');
  });

  it('should call generateName method', () => {
    const generatedName = 'generated-name';
    const spyGenerateName = spyOn(nameGenerator, 'generateName').and.returnValue(generatedName);
    fixture.detectChanges();

    component.generateName();
    fixture.detectChanges();

    const nameElement = fixture.debugElement.query(By.css('#km-create-cluster-name-input')).nativeElement;

    expect(spyGenerateName.and.callThrough()).toHaveBeenCalledTimes(1);
    expect(component.clusterSpecForm.controls['name'].value).toBe(generatedName, 'should patch value');
    expect(nameElement.value).toBe(generatedName, 'should display value in template');
  });

  it('should set type to kubernetes as default', () => {
    expect(component.clusterSpecForm.controls['type'].value).toEqual(ClusterType.Kubernetes);
  });

  it('should set type to openshift as default if kubernetes is hidden', () => {
    config.hide_kubernetes = true;
    createComponent();
    expect(component.clusterSpecForm.controls['type'].value).toEqual(ClusterType.OpenShift);
  });

  it('should show type toggle by default', () => {
    expect(component.hasMultipleTypes()).toBeTruthy();
  });

  it('should not show type toggle if type openshift is hidden', () => {
    config.hide_openshift = true;
    createComponent();
    expect(component.hasMultipleTypes()).toBeFalsy();
  });

  it('should not show type toggle if type kubernetes is hidden', () => {
    config.hide_kubernetes = true;
    createComponent();
    expect(component.hasMultipleTypes()).toBeFalsy();
  });
});
