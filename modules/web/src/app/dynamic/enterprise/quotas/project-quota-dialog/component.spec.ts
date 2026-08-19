//                Kubermatic Enterprise Read-Only License
//                       Version 1.0 ("KERO-1.0”)
//                   Copyright © 2022 Kubermatic GmbH
//
// 1. You may only view, read and display for studying purposes the source
//    code of the software licensed under this license, and, to the extent
//    explicitly provided under this license, the binary code.
// 2. Any use of the software which exceeds the foregoing right, including,
//    without limitation, its execution, compilation, copying, modification
//    and distribution, is expressly prohibited.
// 3. THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND,
//    EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
//    MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
//    IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
//    CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
//    TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
//    SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
//
// END OF TERMS AND CONDITIONS

import {MatDialogModule, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {TestBed, ComponentFixture} from '@angular/core/testing';
import {BrowserModule} from '@angular/platform-browser';
import {ProjectService} from '@core/services/project';
import {QuotaService} from '../service';
import {UserService} from '@core/services/user';
import {SharedModule} from '@shared/module';
import {MatDialogRefMock} from '@test/services/mat-dialog-ref-mock';
import {ProjectMockService} from '@test/services/project-mock';
import {QuotaMockService} from '@test/services/quota-mock';
import {UserMockService} from '@test/services/user-mock';
import {FeatureGatesMockService} from '@test/services/feature-gate-mock';
import {ProjectQuotaDialogComponent} from './component';
import {GlobalModule} from '@core/services/global/module';
import {FeatureGateService, FeatureGates} from '@core/services/feature-gate';
import {Observable, of} from 'rxjs';
import {AcceleratorAccountingPhase, AcceleratorQuota, QuotaDetails} from '@shared/entity/quota';
import {GetQuotasMock} from '@test/data/quota';

describe('AddProjectQuotaDialogComponent', () => {
  let fixture: ComponentFixture<ProjectQuotaDialogComponent>;
  let component: ProjectQuotaDialogComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ProjectQuotaDialogComponent],
      imports: [BrowserModule, NoopAnimationsModule, SharedModule, MatDialogModule, GlobalModule],
      providers: [
        {provide: QuotaService, useClass: QuotaMockService},
        {provide: UserService, useClass: UserMockService},
        {provide: ProjectService, useClass: ProjectMockService},
        {provide: MatDialogRef, useClass: MatDialogRefMock},
        {provide: MAT_DIALOG_DATA, useValue: {}},
        {provide: FeatureGateService, useClass: FeatureGatesMockService},
      ],
    }).compileComponents();
  });

  beforeEach(async () => {
    fixture = TestBed.createComponent(ProjectQuotaDialogComponent);
    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  it('should initialize', async () => {
    expect(component).toBeTruthy();
  });
});

class AcceleratorFeatureGatesMockService {
  get featureGates(): Observable<FeatureGates> {
    return of({kubeVirtAcceleratorQuota: true});
  }
}

describe('ProjectQuotaDialogComponent accelerator accounting', () => {
  let fixture: ComponentFixture<ProjectQuotaDialogComponent>;
  let component: ProjectQuotaDialogComponent;

  // editQuota null models the add dialog, where Material injects no dialog data.
  async function setup(editQuota: QuotaDetails | null): Promise<void> {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      declarations: [ProjectQuotaDialogComponent],
      imports: [BrowserModule, NoopAnimationsModule, SharedModule, MatDialogModule, GlobalModule],
      providers: [
        {provide: QuotaService, useClass: QuotaMockService},
        {provide: UserService, useClass: UserMockService},
        {provide: ProjectService, useClass: ProjectMockService},
        {provide: MatDialogRef, useClass: MatDialogRefMock},
        {provide: MAT_DIALOG_DATA, useValue: editQuota},
        {provide: FeatureGateService, useClass: AcceleratorFeatureGatesMockService},
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectQuotaDialogComponent);
    component = fixture.componentInstance;
    // ngOnInit rather than detectChanges: these cases assert component state, and rendering the
    // add-dialog project combobox trips a pre-existing NG0100 in the test environment.
    component.ngOnInit();
  }

  function quotaWith(
    accountingEnabled: boolean,
    phase?: AcceleratorAccountingPhase,
    accelerators?: AcceleratorQuota[]
  ): QuotaDetails {
    const quota = GetQuotasMock()[0];
    quota.acceleratorAccountingEnabled = accountingEnabled;
    if (accelerators) {
      quota.quota.accelerators = accelerators;
    }
    if (phase) {
      quota.status.globalAcceleratorAccounting = {
        activationPhase: phase,
        observedAccountingRevision: 'revision-1',
        observedQuotaDigest: 'sha256:digest',
        legacyMachinesWithoutFootprint: 0,
        machinesWithInvalidFootprint: 0,
        ready: phase === AcceleratorAccountingPhase.Ready,
      };
    }
    return quota;
  }

  it('should not offer activation while creating a quota', async () => {
    await setup(null);

    expect(component.canEnableAcceleratorAccounting).toBe(false);
    expect(component.canEditAccelerators).toBe(false);
    expect(component.acceleratorAccountingControl.disabled).toBe(true);
  });

  it('should offer activation on an existing quota that has none', async () => {
    await setup(quotaWith(false));

    expect(component.canEnableAcceleratorAccounting).toBe(true);
    expect(component.acceleratorAccountingControl.enabled).toBe(true);
    expect(component.canEditAccelerators).toBe(false);
    expect(component.gpuResources.controls[0].controls.key.disabled).toBe(true);
  });

  it('should freeze the limits while accounting is not ready', async () => {
    await setup(quotaWith(true, AcceleratorAccountingPhase.Activating));

    expect(component.canEnableAcceleratorAccounting).toBe(false);
    expect(component.acceleratorAccountingControl.disabled).toBe(true);
    expect(component.canEditAccelerators).toBe(false);
    expect(component.gpuResources.controls[0].controls.key.disabled).toBe(true);
    // Removal stays available - it is the recovery path out of a blocked accounting state.
    expect(component.canRemoveAccelerators).toBe(true);
  });

  it('should allow editing the limits once accounting is ready', async () => {
    await setup(quotaWith(true, AcceleratorAccountingPhase.Ready));

    expect(component.canEditAccelerators).toBe(true);
    expect(component.gpuResources.controls[0].controls.key.enabled).toBe(true);
    expect(component.acceleratorAccountingControl.disabled).toBe(true);
  });

  // A quota that already carries limits round-trips into the form unchanged, so nothing else marks
  // it as edited - which makes it the case that proves ticking the checkbox is what enables saving.
  const existingLimits: AcceleratorQuota[] = [{provider: 'kubevirt', resources: {'nvidia.com/GA100_A30': '4'}}];
  const updatedCpuLimit = 300;

  // The API omits limits that are unset while the form always carries a control for each, so an
  // untouched dialog only compares equal if both sides are normalized first.
  it('should not report a change for an untouched quota with no accelerator limits', async () => {
    await setup(quotaWith(false));

    expect(component.isQuotaUpdated).toBe(false);
  });

  it('should only report a change once the checkbox is ticked', async () => {
    await setup(quotaWith(false, AcceleratorAccountingPhase.Ready, existingLimits));

    expect(component.isQuotaUpdated).toBe(false);

    component.acceleratorAccountingControl.setValue(true);

    expect(component.isQuotaUpdated).toBe(true);
  });

  it('should omit the activation flag when editing an already activated quota', async () => {
    await setup(quotaWith(true, AcceleratorAccountingPhase.Ready));
    const service = TestBed.inject(QuotaService);
    const updateSpy = jest.spyOn(service, 'updateQuota');

    component.quotaGroup.controls.cpu.setValue(updatedCpuLimit);
    component.getObservable().subscribe();

    // Sending false here would be rejected by the API as an attempt to disable accounting, so an
    // unrelated edit has to leave the field out entirely.
    const payload = updateSpy.mock.calls[updateSpy.mock.calls.length - 1][1];
    expect('enableAcceleratorAccounting' in payload).toBe(false);
  });

  it('should treat ticking the checkbox as a change and send the activation flag', async () => {
    await setup(quotaWith(false));
    const service = TestBed.inject(QuotaService);

    component.acceleratorAccountingControl.setValue(true);

    expect(component.isQuotaUpdated).toBe(true);

    // Spy only now: the template evaluates getObservable() on every change detection cycle, so
    // earlier calls would otherwise be recorded too.
    const updateSpy = jest.spyOn(service, 'updateQuota');
    component.getObservable().subscribe();

    const payload = updateSpy.mock.calls[updateSpy.mock.calls.length - 1][1];
    expect(payload.enableAcceleratorAccounting).toBe(true);
    // Activation must never carry limits - KKP rejects that combination.
    expect(payload.accelerators).toEqual([]);
  });
});
