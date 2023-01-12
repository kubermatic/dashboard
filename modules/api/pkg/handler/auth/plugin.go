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

package auth

import (
	"context"
	"errors"
	"net/http"

	authtypes "k8c.io/dashboard/v2/pkg/provider/auth/types"
	utilerrors "k8c.io/kubermatic/v2/pkg/util/errors"
)

var _ authtypes.TokenVerifier = &TokenVerifierPlugins{}

// TokenVerifierPlugins implements TokenVerifier interface
// by calling registered plugins for a token verification.
type TokenVerifierPlugins struct {
	plugins []authtypes.TokenVerifier
}

// NewTokenVerifierPlugins creates a new instance of TokenVerifierPlugins with the given plugins.
func NewTokenVerifierPlugins(plugins []authtypes.TokenVerifier) *TokenVerifierPlugins {
	return &TokenVerifierPlugins{plugins}
}

// Verify calls all registered plugins to check the given token.
// This method stops when a token has been validated and doesn't try remaining plugins.
// If all plugins were checked an error is returned.
func (p *TokenVerifierPlugins) Verify(ctx context.Context, token string) (authtypes.TokenClaims, error) {
	if len(p.plugins) == 0 {
		return authtypes.TokenClaims{}, errors.New("cannot validate the token - no plugins registered")
	}
	var errList []error
	for _, plugin := range p.plugins {
		claims, err := plugin.Verify(ctx, token)
		if err == nil {
			return claims, nil
		}
		// don't check another verifier when the token expired error is discovered
		var expired *TokenExpiredError
		if errors.As(err, &expired) {
			return authtypes.TokenClaims{}, err
		}

		errList = append(errList, err)
	}
	return authtypes.TokenClaims{}, utilerrors.NewAggregate(errList)
}

var _ authtypes.TokenExtractor = &TokenExtractorPlugins{}

// TokenExtractorPlugins implements TokenExtractor
// by calling registered plugins for a token extraction.
type TokenExtractorPlugins struct {
	plugins []authtypes.TokenExtractor
}

// NewTokenExtractorPlugins creates a new instance of TokenExtractorPlugins with the given plugins.
func NewTokenExtractorPlugins(plugins []authtypes.TokenExtractor) *TokenExtractorPlugins {
	return &TokenExtractorPlugins{plugins}
}

// Extract calls all registered plugins to get a token from the given request.
// This method stops when a token has been found and doesn't try remaining plugins.
// If all plugins were checked an error is returned.
func (p *TokenExtractorPlugins) Extract(r *http.Request) (string, error) {
	if len(p.plugins) == 0 {
		return "", errors.New("cannot validate the token - no plugins registered")
	}
	var errList []error
	for _, plugin := range p.plugins {
		token, err := plugin.Extract(r)
		if err == nil {
			return token, nil
		}
		errList = append(errList, err)
	}
	return "", utilerrors.NewAggregate(errList)
}
