package main

import (
	"flag"
	"fmt"
	"net/http"
	"os"
	"strings"

	"github.com/gorilla/handlers"
	"github.com/elazarl/go-bindata-assetfs"
)

type hijack404 struct {
	http.ResponseWriter
	R         *http.Request
	Handle404 func(w http.ResponseWriter, r *http.Request) bool
}

func (h *hijack404) WriteHeader(code int) {
	if 404 == code && h.Handle404(h.ResponseWriter, h.R) {
		panic(h)
	}
	h.ResponseWriter.WriteHeader(code)
}

func Handle404(handler http.Handler, handle404 func(w http.ResponseWriter, r *http.Request) bool) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		hijack := &hijack404{ResponseWriter: w, R: r, Handle404: handle404}
		defer func() {
			if p := recover(); p != nil {
				if p == hijack {
					return
				}
				panic(p)
			}
		}()
		handler.ServeHTTP(hijack, r)
	})
}

type compliantAssetFS struct {
	assetfs.AssetFS
}

func (fs *compliantAssetFS) Open(name string) (http.File, error) {
	if name == "/real-index.html" {
		name = "/index.html"
	}

	f, err := fs.AssetFS.Open(name)
	if err != nil {
		if strings.HasSuffix(err.Error(), "not found") {
			return nil, os.ErrNotExist
		}
	}
	return f, err
}

func noDirListing(h http.Handler) http.HandlerFunc {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if strings.HasSuffix(r.URL.Path, "/") {
			http.NotFound(w, r)
		}
		h.ServeHTTP(w, r)
	})
}

func main() {
	port := flag.Int("port", 8080, "Port to listen on")
	address := flag.String("address", "0.0.0.0", "Address to listen on")
	flag.Parse()

	afs := compliantAssetFS{*assetFS()}
	fs := http.FileServer(&afs)
	err := http.ListenAndServe(fmt.Sprintf("%s:%d", *address, *port),
		handlers.CombinedLoggingHandler(os.Stdout, Handle404(
			noDirListing(fs),
			func(w http.ResponseWriter, r *http.Request) bool {
				w.Header().Del("Content-Type")
				w.Header().Del("X-Content-Type-Options")
				r.URL.Path = "/real-index.html"
				fs.ServeHTTP(w, r)
				return true
			},
		),
	))
	if err != nil {
		panic(err.Error())
	}
}
