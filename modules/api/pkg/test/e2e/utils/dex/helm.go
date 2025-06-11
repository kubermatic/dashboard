/*
Copyright 2020 The Kubermatic Kubernetes Platform contributors.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

package dex

import (
	"fmt"
	"os"

	"go.uber.org/zap"
	"gopkg.in/yaml.v3"
)

type helmValues struct {
	Dex struct {
		Ingress struct {
			Enabled bool `yaml:"enabled"`
			Hosts   []struct {
				Host  string `yaml:"host"`
				Paths []struct {
					Path     string `yaml:"path"`
					PathType string `yaml:"pathType"`
				} `yaml:"paths"`
			} `yaml:"hosts"`
			TLS []interface{} `yaml:"tls"`
		} `yaml:"ingress"`

		Config struct {
			Issuer           string `yaml:"issuer"`
			EnablePasswordDB bool   `yaml:"enablePasswordDB"`
			StaticClients    []struct {
				ID           string   `yaml:"id"`
				Name         string   `yaml:"name"`
				Secret       string   `yaml:"secret"`
				RedirectURIs []string `yaml:"RedirectURIs"`
			} `yaml:"staticClients"`
		} `yaml:"config"`
	} `yaml:"dex"`
}

// NewClientFromHelmValues is a helper for e2e tests, reading the hack/ci/testdata/dex_values.yaml
// to provide a matching OIDC client. We use this instead of spreading the client ID etc.
// in tons of shell scripts and env vars.
func NewClientFromHelmValues(valuesFile string, clientID string, log *zap.SugaredLogger) (*Client, error) {
	values := helmValues{}

	f, err := os.Open(valuesFile)
	if err != nil {
		return nil, fmt.Errorf("failed to open %s: %w", valuesFile, err)
	}
	defer f.Close()

	if err := yaml.NewDecoder(f).Decode(&values); err != nil {
		return nil, fmt.Errorf("failed to decode %s as YAML: %w", valuesFile, err)
	}

	redirectURI := ""

	for _, client := range values.Dex.Config.StaticClients {
		if client.ID == clientID {
			// The actual redirect URI does not matter, as long as it's registered with
			// Dex. We will intercept the redirect anyway.
			redirectURI = client.RedirectURIs[0]
		}
	}

	if redirectURI == "" {
		return nil, fmt.Errorf("could not find a client with ID %q", clientID)
	}

	// Use the issuer from config instead of constructing from ingress
	providerURI := fmt.Sprintf("%s/auth", values.Dex.Config.Issuer)
	return NewClient(clientID, redirectURI, providerURI, log)
}
