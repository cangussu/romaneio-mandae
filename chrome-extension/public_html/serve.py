#!/usr/bin/env python
import http.server
import socketserver


class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_my_headers()
        super().end_headers()

    def send_my_headers(self):
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")


if __name__ == "__main__":
    PORT = 4242
    with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
        print(f"serving at port {PORT}")
        httpd.serve_forever()
