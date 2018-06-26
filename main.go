package main

import (
	"context"
	"flag"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"
)

func main() {
	addr := flag.String("address", "0.0.0.0:8080", "Address to listen on")
	flag.Parse()

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

	stop := make(chan os.Signal)
	signal.Notify(stop, os.Interrupt, syscall.SIGKILL)

	go func() {
		log.Println("Starting the http server:", *addr)
		if err := s.ListenAndServe(); err != nil {
			panic(err)
		}
	}()

	// Waiting for signal to stop
	<-stop

	ctx, cancel := context.WithTimeout(context.Background(), time.Second)
	defer cancel()

	log.Println("Shutting down the http server")
	if err := s.Shutdown(ctx); err != nil {
		panic(err)
	}
}

func handler(w http.ResponseWriter, r *http.Request) {
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
