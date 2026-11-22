import { connection } from "next/server";

export async function GET() {
  await connection();

  return Response.json({
    status: "ok",
    service: "flexshop",
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
  });
}
