// Copyright 2024 The Kubermatic Kubernetes Platform contributors.
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

import {AdminSettingsAnnotations} from '../entity/settings';

export function getVisibleAnnotations(
  annotations: Record<string, string>,
  settings: AdminSettingsAnnotations
): Record<string, string> {
  const hiddenAnnotations = settings.hiddenAnnotations || [];

  return Object.entries(annotations).reduce((acc, [key, value]) => {
    if (!hiddenAnnotations.includes(key)) {
      acc[key] = value;
    }
    return acc;
  }, {});
}
