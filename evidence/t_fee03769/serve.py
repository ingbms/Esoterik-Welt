"""Threaded static server for local verification runs (Windows-friendly).

Usage: python evidence/t_fee03769/serve.py <root> <port>

SimpleHTTPRequestHandler is single-threaded and refuses connections when the
browser opens many parallel requests; ThreadingHTTPServer avoids that.
"""
import functools
import http.server
import socketserver
import sys


def main() -> int:
    root = sys.argv[1] if len(sys.argv) > 1 else "dist"
    port = int(sys.argv[2]) if len(sys.argv) > 2 else 3208
    handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=root)
    socketserver.ThreadingTCPServer.allow_reuse_address = True
    with socketserver.ThreadingTCPServer(("127.0.0.1", port), handler) as httpd:
        print(f"serving {root} on http://127.0.0.1:{port}/", flush=True)
        httpd.serve_forever()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
