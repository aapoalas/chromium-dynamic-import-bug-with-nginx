type DataEntryName = `/data/${number}`;

const FAVICO = Deno.readFileSync("./nginx/html/favicon.ico");
let cert: string | undefined;
let key: string | undefined;
if (Deno.env.get("USE_SSL")) {
  try {
    cert = Deno.readTextFileSync("./ssl/server.crt");
    key = Deno.readTextFileSync("./ssl/server.key");
  } catch {
    // Ignore read failure, set cert and key to undefined.
    cert = undefined;
    key = undefined;
  }
}

const MEMORY = new Map<string, Uint8Array>();

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
  const dataEntry = Deno.readDirSync("./data");
  for (const entry of dataEntry) {
    if (!entry.name.endsWith(".js")) {
      continue;
    }
    MEMORY.set(
      `/data/${entry.name.substring(0, entry.name.length - 3)}`,
      Deno.readFileSync(`./data/${entry.name}`),
    );
  }
}

const controller = new AbortController();

Deno.addSignalListener("SIGINT", () => {
  if (controller.signal.aborted) {
    console.error("Forcing exit");
    Deno.exit(-1);
  } else {
    console.log("Close signal received, starting shutdown");
    controller.abort();
  }
});

Deno.serve({
  onError(err) {
    console.log("Error:", err);
    return new Response(null, { status: 503 });
  },
  port: 8000,
  cert,
  key,
  signal: controller.signal,
}, (req) => {
  if (req.method === "POST") {
    return new Response(null, { status: 200 });
  } else if (req.url.includes("favico")) {
    return new Response(FAVICO);
  }

  const nonce = Math.random().toString().substring(2);
  if (req.url.includes("/data/")) {
    const name = req.url.substring(req.url.indexOf("/data/")) as DataEntryName;
    const entry = MEMORY.get(name);
    if (!entry) {
      return new Response(null, { status: 404 });
    }
    if (req.headers.has("If-None-Match")) {
      return new Response(null, {
        status: 304,
        headers: [
          ["Cache-Control", "no-cache"],
          ["Content-Type", "application/javascript"],
          [
            "Content-Security-Policy",
            `base-uri 'self';default-src 'self';connect-src 'self';frame-src * blob:;img-src data: mediastream: blob: 'self';object-src 'none';report-uri /csp-report;script-src 'nonce-${nonce}' 'strict-dynamic' 'unsafe-eval';style-src 'unsafe-eval' 'unsafe-inline' 'self';worker-src 'self';block-all-mixed-content;font-src 'self' https: data:;form-action 'self';frame-ancestors 'self';script-src-attr 'none';upgrade-insecure-requests`,
          ],
          ["Etag", 'W/"Kekkonen"'],
          ["Server", "nginx"],
          ["X-Content-Type-Options", "nosniff"],
          ["X-Download-Options", "noopen"],
          ["X-Frame-Options", "SAMEORIGIN"],
          ["X-Frame-Options", "SAMEORIGIN"],
          ["X-Xss-Protection", "0"],
        ],
      });
    }
    return new Response(
      entry,
      {
        headers: [
          ["Cache-Control", "no-cache"],
          ["Content-Type", "application/javascript"],
          [
            "Content-Security-Policy",
            `base-uri 'self';default-src 'self';connect-src 'self';frame-src * blob:;img-src data: mediastream: blob: 'self';object-src 'none';report-uri /csp-report;script-src 'nonce-${nonce}' 'strict-dynamic' 'unsafe-eval';style-src 'unsafe-eval' 'unsafe-inline' 'self';worker-src 'self';block-all-mixed-content;font-src 'self' https: data:;form-action 'self';frame-ancestors 'self';script-src-attr 'none';upgrade-insecure-requests`,
          ],
          ["Etag", 'W/"Kekkonen"'],
          ["Server", "nginx"],
          ["X-Content-Type-Options", "nosniff"],
          ["X-Download-Options", "noopen"],
          ["X-Frame-Options", "SAMEORIGIN"],
          ["X-Frame-Options", "SAMEORIGIN"],
          ["X-Xss-Protection", "0"],
        ],
      },
    );
  }

  const cookie = req.headers.get("cookie");
  const SetCookie = cookie ? [] : [
    ["Set-Cookie", `kekkonen=foobar${Math.random().toString().substring(2)}`],
  ];
  return new Response(
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
    {
      headers: [
        ["Cache-Control", "no-store, max-age=0"],
        ["Content-Type", "text/html"],
        [
          "Content-Security-Policy",
          `base-uri 'self';default-src 'self';connect-src 'self';frame-src * blob:;img-src data: mediastream: blob: 'self';object-src 'none';report-uri /csp-report;script-src 'nonce-${nonce}' 'strict-dynamic' 'unsafe-eval';style-src 'unsafe-eval' 'unsafe-inline' 'self';worker-src 'self';block-all-mixed-content;font-src 'self' https: data:;form-action 'self';frame-ancestors 'self';script-src-attr 'none';upgrade-insecure-requests`,
        ],
        ["Etag", 'W/"Kekkonen"'],
        ["Server", "nginx"],
        ["X-Content-Type-Options", "nosniff"],
        ["X-Download-Options", "noopen"],
        ["X-Frame-Options", "SAMEORIGIN"],
        ["X-Frame-Options", "SAMEORIGIN"],
        ["X-Xss-Protection", "0"],
        ...SetCookie,
      ],
    },
  );
}).finished.then(() => {
  console.log("Closing gracefully");
});
