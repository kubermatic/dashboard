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

export class ClusterRolePatch {}

export class ClusterRoleClusterBinding {
  roleRefName: string;
  subjects: Subjects[];
}

export class CreateClusterRoleClusterBinding {
  email: string;
  role: string;
}

export class ClusterRoleClusterBindingPatch {}

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

export class RolePatch {}

export class RoleBinding {
  creationTimestamp?: Date;
  deletionTimestamp?: Date;
  id: string;
  name: string;
  namespace: string;
  roleRefName: string;
  subjects: Subjects[];
}

export class CreateRoleBinding {
  email: string;
  role: string;
  namespace: string;
}

export class RoleBindingPatch {}

export class Rules {
  apiGroups: string[];
  nonResourceURLs: string[];
  resourceNames: string[];
  resources: string[];
  verbs: string[];
}

export class Subjects {
  apiGroup: string;
  kind: string;
  name: string;
}
