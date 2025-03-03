// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { CommonModule } from '@angular/common';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { Injector, NgModule, Optional, SkipSelf } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { MeteringService } from '@app/dynamic/enterprise/metering/service/metering';
import { HelpPanelComponent } from '@core/components/help-panel/component';
import { AddonService } from '@core/services/addon';
import { ApplicationService } from '@core/services/application';
import { AdminGuard, AuthGuard, AuthzGuard } from '@core/services/auth/guard';
import { Auth } from '@core/services/auth/service';
import { BackupService } from '@core/services/backup';
import { ClusterService } from '@core/services/cluster';
import { ClusterSpecService } from '@core/services/cluster-spec';
import { ClusterTemplateService } from '@core/services/cluster-templates';
import { DatacenterService } from '@core/services/datacenter';
import { DialogModeService } from '@core/services/dialog-mode';
import { EndOfLifeService } from '@core/services/eol';
import { ExternalMachineDeploymentService } from '@core/services/external-machine-deployment';
import { GlobalModule } from '@core/services/global/module';
import { HistoryService } from '@core/services/history';
import { KubeOneClusterSpecService } from '@core/services/kubeone-cluster-spec';
import { KubeOnePresetsService } from '@core/services/kubeone-wizard/kubeone-presets';
import { LabelService } from '@core/services/label';
import { MachineDeploymentService } from '@core/services/machine-deployment';
import { MemberService } from '@core/services/member';
import { MLAService } from '@core/services/mla';
import { NameGeneratorService } from '@core/services/name-generator';
import { OPAService } from '@core/services/opa';
import { OperatingSystemManagerService } from '@core/services/operating-system-manager';
import { PageTitleService } from '@core/services/page-title';
import { ParamsService } from '@core/services/params';
import { PreviousRouteService } from '@core/services/previous-route';
import { AlibabaService } from '@core/services/provider/alibaba';
import { AnexiaService } from '@core/services/provider/anexia';
import { AWSService } from '@core/services/provider/aws';
import { AzureService } from '@core/services/provider/azure';
import { BaremetalService } from '@core/services/provider/baremetal';
import { DigitalOceanService } from '@core/services/provider/digitalocean';
import { EquinixService } from '@core/services/provider/equinix';
import { GCPService } from '@core/services/provider/gcp';
import { HetznerService } from '@core/services/provider/hetzner';
import { KubeVirtService } from '@core/services/provider/kubevirt';
import { NutanixService } from '@core/services/provider/nutanix';
import { OpenStackService } from '@core/services/provider/openstack';
import { VMwareCloudDirectorService } from '@core/services/provider/vmware-cloud-director';
import { VSphereService } from '@core/services/provider/vsphere';
import { RBACService } from '@core/services/rbac';
import { ServiceAccountService } from '@core/services/service-account';
import { SettingsService } from '@core/services/settings';
import { SSHKeyService } from '@core/services/ssh-key';
import { ThemeInformerService } from '@core/services/theme-informer';
import { TokenService } from '@core/services/token';
import { PresetsService } from '@core/services/wizard/presets';
import { SharedModule } from '@shared/module';
import { COOKIE, COOKIE_DI_TOKEN } from '../config';
import { AddMemberComponent } from '../member/add-member/component';
import { EditMemberComponent } from '../member/edit-member/component';
import { CreateServiceAccountDialogComponent } from '../serviceaccount/create-dialog/component';
import { EditServiceAccountDialogComponent } from '../serviceaccount/edit-dialog/component';
import { FooterComponent } from './components/footer/component';
import { NavigationComponent } from './components/navigation/component';
import { ProjectSelectorComponent } from './components/navigation/project/component';
import { NotificationPanelComponent } from './components/notification-panel/component';
import { SidenavComponent } from './components/sidenav/component';
import { UserPanelComponent } from './components/user-panel/component';
import { AuthInterceptor, CheckTokenInterceptor, ErrorNotificationsInterceptor, LoaderInterceptor } from './interceptors';
import { ClusterBackupService } from './services/cluster-backup';

const components = [
  SidenavComponent,
  ProjectSelectorComponent,
  NavigationComponent,
  AddMemberComponent,
  EditMemberComponent,
  CreateServiceAccountDialogComponent,
  EditServiceAccountDialogComponent,
  FooterComponent,
  NotificationPanelComponent,
  UserPanelComponent,
  HelpPanelComponent,
];

const services = [
  Auth,
  AuthGuard,
  AuthzGuard,
  AdminGuard,
  DatacenterService,
  NameGeneratorService,
  ClusterService,
  ParamsService,
  LabelService,
  HistoryService,
  SettingsService,
  RBACService,
  PresetsService,
  PreviousRouteService,
  ThemeInformerService,
  TokenService,
  PageTitleService,
  OPAService,
  ClusterSpecService,
  EndOfLifeService,
  MLAService,
  ClusterTemplateService,
  BackupService,
  MeteringService,
  ClusterBackupService,
  ServiceAccountService,
  MachineDeploymentService,
  ExternalMachineDeploymentService,
  AlibabaService,
  AnexiaService,
  AWSService,
  AzureService,
  DigitalOceanService,
  KubeVirtService,
  EquinixService,
  GCPService,
  HetznerService,
  OpenStackService,
  AddonService,
  MemberService,
  SSHKeyService,
  NutanixService,
  VMwareCloudDirectorService,
  ApplicationService,
  OperatingSystemManagerService,
  KubeOneClusterSpecService,
  KubeOnePresetsService,
  VSphereService,
  DialogModeService,
  BaremetalService,
];

const interceptors = [
  {
    provide: HTTP_INTERCEPTORS,
    useClass: ErrorNotificationsInterceptor,
    multi: true,
  },
  {
    provide: HTTP_INTERCEPTORS,
    useClass: CheckTokenInterceptor,
    multi: true,
  },
  {
    provide: HTTP_INTERCEPTORS,
    useClass: LoaderInterceptor,
    multi: true,
  },
  {
    provide: HTTP_INTERCEPTORS,
    useClass: AuthInterceptor,
    multi: true,
  },
];

@NgModule({
  declarations: [...components],
  exports: [...components],
  imports: [CommonModule, RouterModule, SharedModule, GlobalModule, NoopAnimationsModule],
  providers: [
    ...services,
    ...interceptors,
    {provide: COOKIE_DI_TOKEN, useValue: COOKIE},
    provideHttpClient(withInterceptorsFromDi()),
  ],
})
export class CoreModule {
  static injector: Injector;

  constructor(@Optional() @SkipSelf() parentModule: CoreModule, injector: Injector) {
    if (parentModule) {
      throw new Error('CoreModule is already loaded. Import it in the AppModule only');
    }

    CoreModule.injector = injector;
  }
}
