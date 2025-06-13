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

export enum Condition {
  BeEnabled = 'be.enabled',
  BeDisabled = 'be.disabled',
  BeChecked = 'be.checked',
  BeVisible = 'be.visible',
  Contain = 'contain',
  Exist = 'exist',
  HaveClass = 'have.class',
  HaveLength = 'have.length',
  HaveValue = 'have.value',
  Include = 'include',
  NotBe = 'not.be',
  NotBeChecked = 'not.be.checked',
  NotBeVisible = 'not.be.visible',
  NotBeDisabled = 'not.be.disabled',
  NotContain = 'not.contain',
  NotExist = 'not.exist',
  NotHaveClass = 'not.have.class',
}
