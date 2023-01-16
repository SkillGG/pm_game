import { default as fastify, FastifyReply, FastifyRequest } from "fastify";
import FastifySSEPlugin from "fastify-sse-v2";
import CorsPlugin, { FastifyCorsOptions } from "@fastify/cors";
import CookiePlugin, { FastifyCookieOptions } from "@fastify/cookie";
import { RouteGenericInterface } from "fastify/types/route";
import { Server, IncomingMessage, ServerResponse } from "http";
import { config } from "dotenv";
import { mongoDatabase } from "./database";
import { Routing } from "./routing";

config({ path: "./.env" });

const {
  host,
  user,
  database: databaseData,
  port,
  cookie,
  website,
} = process.env;

const server = fastify({
  logger: {
    level: "warn",
    transport: {
      target: "pino-pretty",
    },
  },
});

let database;
if (databaseData) {
  database = mongoDatabase(databaseData);
  // database.connect();
}

server.register(FastifySSEPlugin);

server.register(CookiePlugin, {
  secret: "secret",
  paseOptions: { maxAge: 90000 },
} as FastifyCookieOptions);

server.register(CorsPlugin, {
  origin: website,
  optionsSuccessStatus: 200,
} as FastifyCorsOptions);

export type FResponse = FastifyReply<
  Server,
  IncomingMessage,
  ServerResponse,
  RouteGenericInterface,
  unknown
>;

export type FRequest<T> = FastifyRequest<{ Params: T; Body: string }>;

const setHeaders = (res: FResponse) => {
  res.header("Access-Control-Allow-Credentials", "true");
};

const getRouteData = <T>(propertyKey: string, fn: Function) => {
  if (typeof fn !== "function")
    throw "Route descriptor should be on a function!";
  if (fn.length !== 2) throw "Route function should have 2 parameters!";
  const reffn = fn as (req: FRequest<T>, res: FResponse) => any;
  const path = propertyKey
    .replace(/\$\$/g, "{")
    .replace(/__/g, "}")
    .replace(/\$/g, "/")
    .replace(/_(.*?)_/g, ":$1")
    .replace(/{/g, "$")
    .replace(/}/g, "_");
  return { fn: reffn, path };
};

export function Route<T>(method: "get" | "post") {
  return function (
    target: Routing,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const { path, fn } = getRouteData(propertyKey, descriptor.value);
    console.log("adding", method.toUpperCase(), "route", path);
    server[method](path, (req: FRequest<T>, res) => {
      console.log("Fired Path", path);
      setHeaders(res);
      fn.bind(target)(req, res);
      if (!res.sent) res.status(200).send("OK");
    });
  };
}

export function SSERoute<T>(method: "get" | "post") {
  return function (
    target: Routing,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const { path, fn } = getRouteData<T>(propertyKey, descriptor.value);
    console.log("adding", method.toUpperCase(), "route", path);
    server[method](path, (req: FRequest<T>, res) => {
      console.log("Fired SSE Path", path);
      fn.bind(target)(req, res);
    });
  };
}

export const startServer = (serverPort: number) => {
  server.listen({ port: serverPort }, (err, addr) => {
    console.log("Listening at ", serverPort);
  });
};
