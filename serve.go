package main

import (
	"flag"
	"fmt"
	"net/http"
	"strings"
	"time"
)

func main() {
	port := flag.Int("port", 8080, "Port to listen on")
	address := flag.String("address", "0.0.0.0", "Address to listen on")
	flag.Parse()

	s := http.NewServeMux()
	s.HandleFunc("/", handler)

	addr := fmt.Sprintf("%s:%d", *address, *port)
	if err := http.ListenAndServe(addr, s); err != nil {
		panic(err)
	}
}

func handler(w http.ResponseWriter, r *http.Request) {
	defer func(start time.Time) {
		fmt.Printf("%s took %v\n", r.URL.Path, time.Since(start))
	}(time.Now())

	if strings.HasSuffix(r.URL.Path, "/") {
		http.NotFound(w, r)
		return
	}

	http.FileServer(http.Dir("./dist")).ServeHTTP(w, r)
}
