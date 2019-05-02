export class ProjectUtils {
  static getStateIconClass(status: string): string {
    switch (status) {
      case 'Active':
        return 'fa fa-circle green';
      case 'Inactive':
        return 'fa fa-circle-o red';
      case 'Terminating':
        return 'fa fa-spin fa-circle-o-notch orange';
      default:
        return 'fa fa-spin fa-circle-o-notch orange';
    }
  }
}
