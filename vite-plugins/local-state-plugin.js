import { promises as fs } from "node:fs";
import path from "node:path";

export const DEFAULT_LOCAL_STATE = { reports: [], todos: [], priorityOverrides: {} };

async function readState(filePath) {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf-8"));
  } catch (err) {
    if (err.code === "ENOENT") return DEFAULT_LOCAL_STATE;
    throw err;
  }
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf-8");
}

export default function localStatePlugin() {
  return {
    name: "local-state-plugin",
    configureServer(server) {
      const filePath = path.resolve(server.config.root, "data", "local-state.json");

      server.middlewares.use("/api/state", async (req, res) => {
        if (req.method === "GET") {
          const state = await readState(filePath);
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(state));
          return;
        }

        if (req.method === "PUT") {
          try {
            const state = JSON.parse(await readBody(req));
            await fs.mkdir(path.dirname(filePath), { recursive: true });
            await fs.writeFile(filePath, JSON.stringify(state, null, 2));
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify(state));
          } catch (err) {
            res.statusCode = 400;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: err.message }));
          }
          return;
        }

        res.statusCode = 405;
        res.end();
      });
    },
  };
}
