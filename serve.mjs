import { readdirSync, readFileSync } from "node:fs";
import { createServer as createHttpServer } from "node:http";
import { createServer as createHttpsServer } from "node:https";
import process from "node:process";

const FAVICO = readFileSync("./nginx/html/favicon.ico");
/**
 * @type {string | undefined}
 */
let cert;
/**
 * @type {string | undefined}
 */
let key;
if (process.env.USE_SSL) {
  try {
    cert = readFileSync("./ssl/server.crt", "utf8");
    key = readFileSync("./ssl/server.key", "utf8");
  } catch {
    // Ignore read failure, set cert and key to undefined.
    cert = undefined;
    key = undefined;
  }
}

/**
 * @typedef {`/data/${number}`} DataEntryName
 */

/**
 * @type {Map<string, Uint8Array>}
 */
const MEMORY = new Map();

const BASE = [
  "/data/1",
  "/data/2",
  "/data/3",
  "/data/4",
  "/data/5",
  "/data/6",
  "/data/7",
  "/data/11",
  "/data/8",
  "/data/10",
  "/data/9",
  "/data/12",
  "/data/13",
  "/data/18",
  "/data/14",
  "/data/16",
  "/data/19",
  "/data/15",
  "/data/17",
  "/data/20",
  "/data/21",
  "/data/180",
  "/data/199",
  "/data/22",
  "/data/23",
  "/data/24",
  "/data/25",
  "/data/26",
  "/data/27",
  "/data/28",
  "/data/29",
];

{
  const dataEntry = readdirSync("./data");
  for (const entry of dataEntry) {
    if (!entry.endsWith(".js")) {
      continue;
    }
    MEMORY.set(
      `/data/${entry.substring(0, entry.length - 3)}`,
      readFileSync(`./data/${entry}`),
    );
  }
}

let closed = false;

process.on("SIGINT", () => {
  if (closed) {
    console.error("Forcing exit");
    process.exit(-1);
  }
  closed = true;
  console.log("Close signal received, starting shutdown");
  server.close(() => {
    console.log("Closing gracefully");
  });
});

const handler = (req, res) => {
  if (req.method === "POST") {
    res.statusCode = 200;
    res.end();
    return;
  } else if (req.url.includes("favico")) {
    res.write(FAVICO);
    res.end();
    return;
  }

  const nonce = Math.random().toString().substring(2);
  if (req.url.includes("/data/")) {
    /**
     * @type {DataEntryName}
     */
    const name = req.url.substring(req.url.indexOf("/data/"));
    const entry = MEMORY.get(name);
    if (!entry) {
      res.statusCode = 404;
      res.end();
      return;
    }
    if (req.headers["if-none-match"]) {
      res.statusCode = 304;
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Content-Type", "application/javascript");
      res.setHeader(
        "Content-Security-Policy",
        `base-uri 'self';default-src 'self';connect-src 'self';frame-src * blob:;img-src data: mediastream: blob: 'self';object-src 'none';report-uri /csp-report;script-src 'nonce-${nonce}' 'strict-dynamic' 'unsafe-eval';style-src 'unsafe-eval' 'unsafe-inline' 'self';worker-src 'self';block-all-mixed-content;font-src 'self' https: data:;form-action 'self';frame-ancestors 'self';script-src-attr 'none';upgrade-insecure-requests`,
      );
      res.setHeader("Etag", 'W/"Kekkonen"');
      res.setHeader("Server", "nginx");
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("X-Download-Options", "noopen");
      res.setHeader("X-Frame-Options", "SAMEORIGIN");
      res.setHeader("X-Frame-Options", "SAMEORIGIN");
      res.setHeader("X-Xss-Protection", "0");
      res.end();
      return;
    }
    res.statusCode = 200;
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Content-Type", "application/javascript");
    res.setHeader(
      "Content-Security-Policy",
      `base-uri 'self';default-src 'self';connect-src 'self';frame-src * blob:;img-src data: mediastream: blob: 'self';object-src 'none';report-uri /csp-report;script-src 'nonce-${nonce}' 'strict-dynamic' 'unsafe-eval';style-src 'unsafe-eval' 'unsafe-inline' 'self';worker-src 'self';block-all-mixed-content;font-src 'self' https: data:;form-action 'self';frame-ancestors 'self';script-src-attr 'none';upgrade-insecure-requests`,
    );
    res.setHeader("Etag", 'W/"Kekkonen"');
    res.setHeader("Server", "nginx");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Download-Options", "noopen");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.setHeader("X-Xss-Protection", "0");
    res.write(entry);
    res.end();
    return;
  }

  const cookie = req.headers.cookie;

  res.statusCode = 2000;

  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("Content-Type", "text/html");
  res.setHeader(
    "Content-Security-Policy",
    `base-uri 'self';default-src 'self';connect-src 'self';frame-src * blob:;img-src data: mediastream: blob: 'self';object-src 'none';report-uri /csp-report;script-src 'nonce-${nonce}' 'strict-dynamic' 'unsafe-eval';style-src 'unsafe-eval' 'unsafe-inline' 'self';worker-src 'self';block-all-mixed-content;font-src 'self' https: data:;form-action 'self';frame-ancestors 'self';script-src-attr 'none';upgrade-insecure-requests`,
  );
  res.setHeader("Etag", 'W/"Kekkonen"');
  res.setHeader("Server", "nginx");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Download-Options", "noopen");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("X-Xss-Protection", "0");
  if (!cookie) {
    res.setHeader(
      "Set-Cookie",
      `kekkonen=foobar${Math.random().toString().substring(2)}`,
    );
  }

  res.statusCode = 404;
  res.write(
    `<!DOCTYPE html>
      <head>
        <style>
          .content { display: grid; gap: 2px; width: 100%; height: 100%; grid-template-columns: repeat(auto-fill, 30px); grid-template-rows: repeat(auto-fill, 30px); }
          .ok { background: green; border-radius: 5px; text-align: center; line-height: 25px; }
          .err { background: red; border-radius: 5px; text-align: center; line-height: 25px; }
        </style>
        <script type="importmap" nonce="${nonce}">
          {
            "imports": {
              "/data/": "./data/"
            }
          }
        </script>
        <script type="module" nonce="${nonce}" async>
          setTimeout(() => {
            Promise.all([${
      BASE.map((x) => `import("${x}")`).join(",\n")
    }].map(x => x.then(data => {
                const el = document.createElement("div");
                el.classList.value = "ok";
                el.textContent = "OK";
                el.title = data.default;
                document.body.firstElementChild.appendChild(el);
            }).catch(err => {
                const el = document.createElement("div");
                el.classList.value = "err";
                el.textContent = "ERR";
                el.title = err.stack || err.message;
                document.body.firstElementChild.appendChild(el);
                throw new Error("Load failed", { cause: err });
            }))).then(() => {
                window.location.reload()
            }).catch(err => {
                console.error(err);
                navigator.sendBeacon("./report-error");
            });
          }, 100);
        </script>
      </head>
      <body>
        <div class="content"></div>
      </body>
    </html>`,
  );
  res.end();
};

/**
 * @type {ReturnType<createHttpServer> | ReturnType<createHttpsServer>}
 */
let server;
if (cert && key) {
  server = createHttpsServer({
    cert,
    key,
  }, handler).listen(8000);
  server.once("listening", () => {
    console.log("Listening on https://localhost:8000/");
  });
} else {
  server = createHttpServer(handler).listen(8000);
  server.once("listening", () => {
    console.log("Listening on http://localhost:8000/");
  });
}
