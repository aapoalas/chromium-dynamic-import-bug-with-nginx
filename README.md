# Chromium dynamic imports error with `net::ERR_FAILED` with an HTTPS nginx reverse proxy

This repository reproduces a Chromium dynamic import bug that appears only with
Chrome (presumably also Chromium) when combined with an nginx reverse proxy. The
bug does not reproduce if the nginx reverse proxy is removed from the equation,
not similarly it never reproduces on Firefox. So this is a combination of nginx
and Chromium together, not just nginx.

The crux of the bug is that sometimes when loading a fairly large number of
interconnected ECMAScript modules, the HTTPS request for some of the down-stream
modules will fail with a `net::ERR_FAILED`. This happens fairly regularly,
between once every 4 to 10 page loads in a real project. This reproduction fails
less often, taking up to some minutes to error out.

## How to run the test?

1. Checkout this repository.
1. Get [Deno](https://deno.com/) or [Node.js](https://nodejs.org/).
1. Get [nginx](https://nginx.org/): My version is 1.20.1.
1. Replace `./ssl/server.crt` and `./ssl/server.key` with an SSL certificate and
   key of your choice. For the default setup these need to work in localhost.
1. Run
   `deno run --allow-env=USE_SSL --allow-net=0.0.0.0:8000 --allow-read=./ serve.ts`
   or `node serve.mjs`
   - Alternatively: Prepend `USE_SSL=1` to either of the commands to run an
     HTTPS host.
1. Open Chrome / Chromium at `http://localhost:8000/` (or
   `https://localhost:8000/` if running with `USE_SSL=1`).
1. Observe the page dynamically loading dependencies and then refreshing itself
   if no errors appeared.

This loop should work without any issues for however long. (I've personally
tested running it for approximately 5 hours.)

To get the bug to appear, start the nginx reverse proxy by running
`./run_nginx`. Note that this will likely remove root permissions (sudo).

Now with a reverse proxy proxying requests from `https://localhost/test/` to
your server running at `http(s)://localhost:8000/`, open the page again and let
it run. Eventually the page load loop will be interrupted by one or more of the
boxes going red. This indicates that a load failed. The errors will have been
logged to console. If you want to get a `.har` out of this you need to open
DevTools before the page load happens but note that having Network tab open will
stop the bug from appearing.

## What workarounds exist?

The first workaround is to either not use Chromium, or not use nginx.

The second workaround is to add a ServiceWorker onto the page and intercept the
dynamic imports there. Then proceed to `fetch()` the request, clone the response
you get and put the clone into a `Cache` in the ServiceWorker while returning
the original fetch response. Then, on subsequent page loads serve the response
from cache.

The third workaround is to keep the Chrome DevTools Network tab open during page
load. It seems like the bug might be timing dependent, and the Network tab then
slows down the timings of the requests enough that the bug does not appear.

The fourth "workaround" that seems to work is to comment out the
`const data = "....";` line in the source files being served, or entirely remove
the data from the files leaving behind only the imports. This does not change
the weight of the files, only how they're parsed as JavaScript. This again
points to this being potentially a timing issue. Obviously, this is not possible
in a real application.

The fifth "workaround" that seems to work as well is changing the nginx reverse
proxy to use HTTP. Obviously, this is not acceptable in a real application
either.

No other workarounds are known at this time.

## What does not work?

1. Removing import map usage does not fix the bug.
1. Removing all headers from the responses does not fix the bug.
1. Switching from Node to Deno, or Deno to Node does not fix the bug. (Bug
   originates from a Node hosted service, but reproduces with both the minimal
   Deno and Node servers in this repository.)
1. Using / not using HTTPS on the server: Both HTTP and HTTPS servers reproduce
   the issue when behind the reverse proxy.
1. Changing `keepalive_timeout` in `nginx.conf`: The bug reproduces at
   `keepalive_timeout 1` and `keepalive_timeout 1000`.
1. Changing `keepalive_requests` in `nginx.conf`: The bug reproduces at
   `keepalive requests 250` and `keepalive_requests 10000`.
   - Note: It seems that `keepalive_requests 10000` is however capable of making
     the bug very unlikely to reproduce.

## Error data

I've included [a .har file](./dynamic-import_error_with_nginx.har) that is
captured from this minimal reproduction. You can search for `"net::ERR_FAILED"`
in the file to find the requests that failed.
