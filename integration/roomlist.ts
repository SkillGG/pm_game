import { RouteResponse } from "./routebacks";

export type ServerResponse = {
  response: {
    status: number;
    data: string | RouteResponse;
  };
};

export type ServerError = {
  status: number;
  message: string;
  response: string;
};
