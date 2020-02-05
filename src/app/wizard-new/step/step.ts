export enum StepRegistry {
  Cluster = 'Cluster',
  Provider = 'Provider',
  Datacenter = 'Datacenter',
  Settings = 'Settings',
  Summary = 'Summary',
}

export class WizardStep {
  constructor(readonly name: string, public enabled = true) {}
}
