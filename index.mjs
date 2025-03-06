import { range, responseRange } from "jsr:@oak/commons/range";
import { typeByExtension } from "jsr:@std/media-types/type-by-extension";
import { extname } from "jsr:@std/path/extname";
import * as path from "jsr:@std/path";

/*
    this is borrowed from https://jsr.io/@oak/commons/doc/range for the time being
*/
export default async function( req, vhost ) {
    const url = new URL(req.url);
    const file = await Deno.open( path.join( vhost.root, url.pathname ) );
    const fileInfo = await file.stat();
    const headers = { "accept-ranges": "bytes", "content-type": typeByExtension( extname( url.pathname  )) };
    if (req.method === "HEAD") {
        return new Response(null, {
            headers: {
            ...headers,
            "content-length": String(fileInfo.size),
            },
        });
    }
    if (req.method === "GET") {
        const result = await range(req, fileInfo);
        if (result.ok) {
            if (result.ranges) {
                return responseRange(file, fileInfo.size, result.ranges, {
                    headers,
                }, { type });
            } else {
                return new Response(file.readable, {
                    headers: {
                        ...headers,
                        "content-length": String(fileInfo.size),
                    },
                });
            }
        } else {
            return new Response(null, {
                status: 416,
                statusText: "Range Not Satisfiable",
                headers,
            });
        }
    }
    return new Response(null, { status: 405, statusText: "Method Not Allowed" });
};

