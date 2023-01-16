export type LocationData = {
  path: string[];
  search: Map<string, string>;
};

export const parseLocation = (): LocationData => {
  const { search: searchString, pathname: path } = window.location;
  if (searchString) {
    const search = new Map();
    const matches = searchString.matchAll(/\??(.+)=([^&]+?)&?/g);
    let match = matches.next();
    do {
      search.set(match.value[1], match.value[2]);
      match = matches.next();
    } while (!match.done);
    return { path: path.split('/'), search };
  } else {
    return { path: path.split('/'), search: new Map([]) };
  }
};

(<any>window).parseLocation = parseLocation;
