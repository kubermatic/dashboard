import {HttpClientModule} from '@angular/common/http';
import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {ReactiveFormsModule} from '@angular/forms';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {WizardService} from '../../../../core/services';
import {SharedModule} from '../../../../shared/shared.module';
import {fakePacketCluster} from '../../../../testing/fake-data/cluster.fake';
import {PacketClusterSettingsComponent} from './packet.component';

describe('PacketClusterSettingsComponent', () => {
  let fixture: ComponentFixture<PacketClusterSettingsComponent>;
  let component: PacketClusterSettingsComponent;

  beforeEach(async(() => {
    TestBed
        .configureTestingModule({
          imports: [
            BrowserModule,
            BrowserAnimationsModule,
            ReactiveFormsModule,
            SharedModule,
            HttpClientModule,
          ],
          declarations: [
            PacketClusterSettingsComponent,
          ],
          providers: [
            WizardService,
          ],
        })
        .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PacketClusterSettingsComponent);
    component = fixture.componentInstance;
    component.cluster = fakePacketCluster();
    component.cluster.spec.cloud.packet.apiKey = '';
    component.cluster.spec.cloud.packet.projectID = '';
    component.cluster.spec.cloud.packet.billingCycle = '';
    fixture.detectChanges();
  });

  it('should create the packet cluster cmp', () => {
    expect(component).toBeTruthy();
  });

  it('form invalid after creating', () => {
    expect(component.form.valid).toBeFalsy();
  });

  it('apiKey field validity', () => {
    expect(component.form.valid).toBeFalsy();
    expect(component.form.controls.apiKey.valid).toBeFalsy();
    expect(component.form.controls.apiKey.hasError('required')).toBeTruthy();

    component.form.controls.apiKey.patchValue('foo');
    expect(component.form.controls.apiKey.hasError('required')).toBeFalsy();
    expect(component.form.controls.apiKey.hasError('minlength')).toBeFalsy();
  });
});
