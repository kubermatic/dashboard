import {ProjectEntity} from '../../entity/ProjectEntity';

export class ProjectUtils {
  static getStateIconClass(status: string): string {
    switch (status) {
      case 'Active':
        return 'fa fa-circle green';
      case 'Inactive':
        return 'fa fa-circle red';
      case 'Terminating':
        return 'fa fa-circle orange';
      default:
        return 'fa fa-circle orange';
    }
  }

  static isProjectActive(project: ProjectEntity): boolean {
    return !!project && project.status === 'Active';
  }
}
