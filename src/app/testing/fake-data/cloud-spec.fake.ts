import {ProviderSettingsPatch} from '../../core/services/cluster/cluster.service';

export function doPatchCloudSpecFake(): ProviderSettingsPatch {
  return {
    cloudSpecPatch: {
      digitalocean: {
        token:
          'hjdfzur8e9rejkdfjuier898erijdfuier9re8difuer8fdiufdir8idfuuiiui',
      },
    },
    isValid: true,
  };
}
