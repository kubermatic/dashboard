import { DigitaloceanCloudSpec } from './../../shared/entity/cloud/DigitialoceanCloudSpec';
import { CloudSpec } from './../../shared/entity/ClusterEntity';

export const doCloudSpecFake = new CloudSpec(
    'region',
    new DigitaloceanCloudSpec('token'),
    null,
    null,
    null,
    null,
    null
);
