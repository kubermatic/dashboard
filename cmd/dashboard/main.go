/*
Copyright 2021 The Kubermatic Kubernetes Platform contributors.

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

package main

import (
	"context"
	"flag"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/prometheus/client_golang/prometheus/promhttp"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"

	"k8c.io/dashboard/v2/pkg/version/kubermatic"
)

func main() {
	addr := flag.String("address", "0.0.0.0:8080", "Address to listen on")
	flag.Parse()

	config := zap.NewProductionConfig()
	config.EncoderConfig.EncodeTime = zapcore.ISO8601TimeEncoder
	config.EncoderConfig.TimeKey = "time"
	config.DisableCaller = true
	config.DisableStacktrace = true

	rawLog, _ := config.Build()
	log := rawLog.Sugar()

	log.Infof("Kubermatic Dashboard %s - %s", getEditionDisplayName(), kubermatic.Version)

	mux := http.NewServeMux()
	mux.Handle("/metrics", promhttp.HandlerFor(registry, promhttp.HandlerOpts{}))
	mux.Handle("/", InstrumentHandler(http.HandlerFunc(handler)))

	s := http.Server{
		Addr:    *addr,
		Handler: mux,

		ReadTimeout:  5 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  2 * time.Minute,
	}

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)

	go func() {
		log.Infow("Starting the HTTP server", "listen", *addr)
		if err := s.ListenAndServe(); err != nil {
			log.Fatalw("Failed to start server", zap.Error(err))
		}
	}()

	// Waiting for signal to stop
	<-stop

	ctx, cancel := context.WithTimeout(context.Background(), time.Second)
	defer cancel()

	log.Info("Signal received, shutting the HTTP server down")
	if err := s.Shutdown(ctx); err != nil {
		log.Fatalw("Failed to shutdown", zap.Error(err))
	}
}

func handler(w http.ResponseWriter, r *http.Request) {
	// Prevent being shown in iframes
	w.Header().Add("X-Frame-Options", "DENY")

	// disable caching for the root(index.html) and all config files
	if r.URL.Path == "/" || isCacheDisabled(r.URL.Path) {
		// Forces caches to submit the request to the origin server for validation before releasing a cached copy.
		w.Header().Add("Cache-Control", "no-cache, no-store, must-revalidate")

		// It is used for backwards compatibility with HTTP/1.0 caches.
		w.Header().Add("Pragma", "no-cache")
	}

	// Don't list directories, a directory has a / suffix.
	if r.URL.Path != "/" && strings.HasSuffix(r.URL.Path, "/") {
		http.NotFound(w, r)
		return
	}

	// If the file can be found serve the file
	dir := http.Dir("./dist")
	if _, err := dir.Open(r.URL.Path); err == nil {
		http.FileServer(dir).ServeHTTP(w, r)
		return
	}

	// If we can't find the file, we still serve index.html
	// to show dynamic pages or a 404 page
	http.ServeFile(w, r, "./dist/index.html")
}

func isCacheDisabled(path string) bool {
	noCacheList := []string{
		"/index.html",
		"/config/",
		"/assets/config",
	}

	for _, prefix := range noCacheList {
		if strings.HasPrefix(path, prefix) {
			return true
		}
	}

	return false
}

func getEditionDisplayName() string {
	if kubermatic.Edition == "ce" {
		return "Community Edition"
	}

	return "Enterprise Edition"
}
