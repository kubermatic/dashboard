// Copyright 2022 The Kubermatic Kubernetes Platform contributors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {QuotaDetails} from '@shared/entity/quota';

export const GetQuotasMock = (): QuotaDetails[] => [
  {
    name: 'project-tq9vx57zgc',
    subjectName: 'tq9vx57zgc',
    subjectKind: 'project',
    quota: {
      cpu: '200',
      memory: '200',
      storage: '200',
    },
    status: {
      globalUsage: {
        cpu: '0',
        memory: '0',
        storage: '0',
      },
      localUsage: {
        cpu: '0',
        memory: '0',
        storage: '0',
      },
    },
  },
  {
    name: 'project-bdtcw6zjpw',
    subjectName: 'bdtcw6zjpw',
    subjectKind: 'project',
    quota: {
      cpu: '100',
      memory: '100',
      storage: '100',
    },
    status: {
      globalUsage: {
        cpu: '0',
        memory: '0',
        storage: '0',
      },
      localUsage: {
        cpu: '0',
        memory: '0',
        storage: '0',
      },
    },
  },
  {
    name: 'project-7s4ffcp9kv',
    subjectName: '7s4ffcp9kv',
    subjectKind: 'project',
    quota: {
      memory: '100M',
      storage: '600G',
    },
    status: {
      globalUsage: {
        cpu: '0',
        memory: '0',
        storage: '0',
      },
      localUsage: {
        cpu: '0',
        memory: '0',
        storage: '0',
      },
    },
  },
  {
    name: 'project-q4vgtz2rzh',
    subjectName: 'q4vgtz2rzh',
    subjectKind: 'project',
    quota: {
      cpu: '4',
      memory: '500M',
    },
    status: {
      globalUsage: {
        cpu: '0',
        memory: '0',
        storage: '0',
      },
      localUsage: {
        cpu: '0',
        memory: '0',
        storage: '0',
      },
    },
  },
  {
    name: 'project-c7xhcgtcvh',
    subjectName: 'c7xhcgtcvh',
    subjectKind: 'project',
    quota: {
      cpu: '3',
      storage: '100G',
    },
    status: {
      globalUsage: {
        cpu: '0',
        memory: '0',
        storage: '0',
      },
      localUsage: {
        cpu: '0',
        memory: '0',
        storage: '0',
      },
    },
  },
  {
    name: 'project-f8vwtl5w7s',
    subjectName: 'f8vwtl5w7s',
    subjectKind: 'project',
    quota: {
      cpu: '200',
      memory: '200',
      storage: '200',
    },
    status: {
      globalUsage: {
        cpu: '0',
        memory: '0',
        storage: '0',
      },
      localUsage: {
        cpu: '0',
        memory: '0',
        storage: '0',
      },
    },
  },
  {
    name: 'project-svjfqck269',
    subjectName: 'svjfqck269',
    subjectKind: 'project',
    quota: {
      cpu: '300',
      memory: '300',
      storage: '300',
    },
    status: {
      globalUsage: {
        cpu: '0',
        memory: '0',
        storage: '0',
      },
      localUsage: {
        cpu: '0',
        memory: '0',
        storage: '0',
      },
    },
  },
  {
    name: 'project-67xfk4q4kg',
    subjectName: '67xfk4q4kg',
    subjectKind: 'project',
    quota: {
      cpu: '500',
      memory: '500',
      storage: '500',
    },
    status: {
      globalUsage: {
        cpu: '0',
        memory: '0',
        storage: '0',
      },
      localUsage: {
        cpu: '0',
        memory: '0',
        storage: '0',
      },
    },
  },
  {
    name: 'project-x45ktg7fwg',
    subjectName: 'x45ktg7fwg',
    subjectKind: 'project',
    quota: {
      cpu: '8',
      memory: '100Mi',
      storage: '20Gi',
    },
    status: {
      globalUsage: {
        cpu: '0',
        memory: '0',
        storage: '0',
      },
      localUsage: {
        cpu: '0',
        memory: '0',
        storage: '0',
      },
    },
  },
];
