/*
Copyright 2026 The Kubermatic Kubernetes Platform contributors.

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
	"fmt"
	"html"
	"net/http"

	"k8c.io/kubermatic/v2/pkg/log"
	utilerrors "k8c.io/kubermatic/v2/pkg/util/errors"
)

const oidcCallbackHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>%s</title>
  <link rel="stylesheet" href="/assets/css/auth.css">
</head>
<body>
  <div class="content">
    <h1 class="%s">%s</h1>
    <p class="subtitle">%s</p>
  </div>
</body>
</html>`

func FormatOIDCCallbackErrorPage(errMsg string) string {
	return fmt.Sprintf(oidcCallbackHTML, "Authentication failed", "title error", "Authentication failed", html.EscapeString(errMsg))
}

func writeOIDCCallbackHTML(w http.ResponseWriter, statusCode int, title, titleClass, subtitle string) {
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.Header().Set("Cache-Control", "no-store")
	w.Header().Set("Pragma", "no-cache")
	w.WriteHeader(statusCode)
	if _, err := fmt.Fprintf(w, oidcCallbackHTML, title, titleClass, title, subtitle); err != nil {
		log.Logger.Error(err)
	}
}

func OIDCCallbackSuccessResponse(w http.ResponseWriter) {
	writeOIDCCallbackHTML(w, http.StatusOK, "Login successful", "title", "You can close this tab and return to the previous page.")
}

func OIDCCallbackErrorEncoder(_ context.Context, err error, w http.ResponseWriter) {
	errorCode := http.StatusInternalServerError
	errMsg := err.Error()
	var httpErr utilerrors.HTTPError
	if errors.As(err, &httpErr) {
		errorCode = httpErr.StatusCode()
		errMsg = httpErr.Error()
	}

	writeOIDCCallbackHTML(w, errorCode, "Authentication failed", "title error", html.EscapeString(errMsg))
}
