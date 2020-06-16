import {AbstractControl} from '@angular/forms';
import {DataCenterEntity} from '../../entity/DatacenterEntity';

export class AdmissionPluginUtils {
  static getPluginName(name: string): string {
    return name.replace(/([A-Z])/g, ' $1').trim();
  }

  static getJoinedPluginNames(plugins: string[]): string {
    const prettifiedNames: string[] = [];
    plugins.forEach(plugin => prettifiedNames.push(this.getPluginName(plugin)));
    return prettifiedNames.join(', ');
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
}
