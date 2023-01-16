import { MongoClient } from "mongodb";

export const mongoDatabase = (dbString: string) => {
  const a: any[] = [];

  return {
    connect: () => {
      a.push(12);
    },
    list: () => console.log(a),
  };
};
