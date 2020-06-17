import {AbstractControl} from '@angular/forms';
import {DataCenterEntity} from '../../entity/DatacenterEntity';
import {ClusterEntity} from '../../entity/ClusterEntity';

export enum AdmissionPlugin {
  PodSecurityPolicy = 'PodSecurityPolicy',
  PodNodeSelector = 'PodNodeSelector',
}

export class AdmissionPluginUtils {
  static getPluginName(name: string): string {
    return name.replace(/([A-Z])/g, ' $1').trim();
  }

  static getJoinedPluginNames(plugins: string[]): string {
    return plugins.map(plugin => this.getPluginName(plugin)).join(', ');
  }

  static isPluginEnabled(form: AbstractControl, name: string): boolean {
    return !!form.value && form.value.some(x => x === name);
  }

  static isPodSecurityPolicyEnforced(datacenter: DataCenterEntity): boolean {
    return !!datacenter && !!datacenter.spec && !!datacenter.spec.enforcePodSecurityPolicy;
  }

  static updateSelectedPluginArray(form: AbstractControl, name: string): string[] {
    const plugins: string[] = form.value ? form.value : [];
    if (!plugins.some(x => x === name)) {
      plugins.push(name);
    }
    return plugins;
  }

  static updateSelectedPluginArrayIfPSPEnforced(cluster: ClusterEntity, datacenter: DataCenterEntity): string[] {
    const plugins: string[] = cluster.spec.admissionPlugins ? cluster.spec.admissionPlugins : [];
    if (!!this.isPodSecurityPolicyEnforced(datacenter) && !plugins.some(x => x === AdmissionPlugin.PodSecurityPolicy)) {
      plugins.push(AdmissionPlugin.PodSecurityPolicy);
    }
    return plugins;
  }
}
