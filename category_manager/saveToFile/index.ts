import fastify from "fastify";
import { FRequest, FResponse } from "./../../panstwamiasta_backend/server";
import fs from "fs";
import path from "path";

const server = fastify();
const filePath = path.join(__dirname, "./../../integration/EN_data.json");
console.log(filePath);

server.post("/save", (req: FRequest<{}>, res: FResponse) => {
    try {
        const json = JSON.parse(req.body) as { data: any } | undefined;
        if (json && json.data) {
            console.log("saving to file");
            res.header("Access-Control-Allow-Origin", "*");
            res.status(200).send("OK");
            fs.writeFileSync(filePath, json.data);
        } else {
            res.status(400).send("No data to save!");
        }
    } catch (err) {
        res.status(400).send("Error parsing body!" + (err as Error).message);
    }
});

server.listen({ port: 9090 }, () => {
    console.log("Listening on 9090");
});
