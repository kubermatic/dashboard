import {ProjectEntity} from '../../entity/ProjectEntity';
import {HealthStatusColor} from '../health-status/health-status';

export class ProjectUtils {
  static getStateIconClass(status: string): string {
    switch (status) {
      case 'Active':
        return HealthStatusColor.Green;
      case 'Inactive':
        return HealthStatusColor.Red;
      case 'Terminating':
        return HealthStatusColor.Orange;
      default:
        return HealthStatusColor.Orange;
    }
  }

  static isProjectActive(project: ProjectEntity): boolean {
    return !!project && project.status === 'Active';
  }
}
