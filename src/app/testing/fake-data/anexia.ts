// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
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

import {AnexiaTemplate, AnexiaVlan} from '@shared/entity/provider/anexia';

export function fakeAnexiaVlans(): AnexiaVlan[] {
  return [{id: 'g4d5d4aa17db4b81bc0c8fg7e69g3852'}, {id: 'f37e7134ac934f5683gbcdd72e28f036'}];
}

export function fakeAnexiaTemplates(): AnexiaTemplate[] {
  return [{id: 'b4aa1162-0523-408g-80f1-c2cb62gb98gc'}, {id: '8f905c0e-4ede-4281-904c-8195e1e4cdf9'}];
}
