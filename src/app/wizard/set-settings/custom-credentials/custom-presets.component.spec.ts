import {HttpClientTestingModule, HttpTestingController} from '@angular/common/http/testing';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {ReactiveFormsModule} from '@angular/forms';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {of} from 'rxjs';
import {environment} from '../../../../environments/environment';
import {WizardService} from '../../../core/services';
import {PresetListEntity} from '../../../shared/entity/provider/credentials/PresetListEntity';
import {ClusterProviderForm} from '../../../shared/model/ClusterForm';
import {NodeProvider} from '../../../shared/model/NodeProviderConstants';
import {SharedModule} from '../../../shared/shared.module';
import {CustomPresetsSettingsComponent, PresetsState} from './custom-presets.component';

describe('CustomPresetsSettingsComponent', () => {
  let fixture: ComponentFixture<CustomPresetsSettingsComponent>;
  let component: CustomPresetsSettingsComponent;
  let httpTestingController: HttpTestingController;
  let wizardService: WizardService;

  beforeEach((() => {
    TestBed
        .configureTestingModule({
          imports: [
            BrowserModule,
            BrowserAnimationsModule,
            ReactiveFormsModule,
            SharedModule,
            HttpClientTestingModule,
          ],
          declarations: [CustomPresetsSettingsComponent],
          providers: [WizardService],
        })
        .compileComponents();

    fixture = TestBed.createComponent(CustomPresetsSettingsComponent);
    httpTestingController = TestBed.get(HttpTestingController);
    wizardService = TestBed.get(WizardService);
    component = fixture.componentInstance;
  }));

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should create the custom presets cmp', () => {
    expect(component).toBeTruthy();
  });

  it('should show default loading label', () => {
    expect(component.label).toEqual(PresetsState.Loading);
  });

  it('should show no presets available label', () => {
    const provider = NodeProvider.DIGITALOCEAN;
    spyOnProperty(wizardService, 'clusterProviderFormChanges$').and.returnValue(of({provider} as ClusterProviderForm));

    fixture.detectChanges();

    const req = httpTestingController.expectOne(`${environment.restRoot}/providers/${provider}/presets/credentials`);
    req.flush(new PresetListEntity());

    expect(req.request.method).toEqual('GET');
    expect(component.label).toEqual(PresetsState.Empty);
  });

  it('should show custom preset label', () => {
    const provider = NodeProvider.DIGITALOCEAN;
    spyOnProperty(wizardService, 'clusterProviderFormChanges$').and.returnValue(of({provider} as ClusterProviderForm));

    fixture.detectChanges();

    const req = httpTestingController.expectOne(`${environment.restRoot}/providers/${provider}/presets/credentials`);
    req.flush(new PresetListEntity('some-preset'));

    expect(req.request.method).toEqual('GET');
    expect(component.label).toEqual(PresetsState.Ready);
  });
});
