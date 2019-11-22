export class ClusterRoleName {
  name: string;
}

export class ClusterRole {
  creationTimestamp?: Date;
  deletionTimestamp?: Date;
  id: string;
  name: string;
  rules: Rules[];
}

export class ClusterBinding {
  roleRefName: string;
  subjects: Subjects[];
}

export class CreateClusterBinding {
  email: string;
  role: string;
}

export class Namespace {
  name: string;
}

export class RoleName {
  name: string;
  namespace: string[];
}

export class Role {
  creationTimestamp?: Date;
  deletionTimestamp?: Date;
  id: string;
  name: string;
  namespace: string;
  rules: Rules[];
}

export class Binding {
  namespace: string;
  roleRefName: string;
  subjects: Subjects[];
}

export class CreateBinding {
  email: string;
  role: string;
  namespace: string;
}

export class Rules {
  apiGroups: string[];
  nonResourceURLs: string[];
  resourceNames: string[];
  resources: string[];
  verbs: string[];
}

export class Subjects {
  apiGroup?: string;
  kind?: string;
  name?: string;
}

export class SimpleClusterBinding {
  name: string;
  role: string;
}

export class SimpleBinding {
  name: string;
  role: string;
  namespace: string;
}
