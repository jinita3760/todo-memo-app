import type { Context, Config } from "@netlify/functions";
import { getStore } from "@netlify/blobs";

// 메모장-캘린더 데이터를 저장/조회하는 API.
// GET  /api/schedule  -> 현재 저장된 데이터를 반환
// POST /api/schedule  -> 전달된 JSON으로 데이터를 덮어씀 (마지막에 쓴 내용이 우선)
export default async (req: Request, context: Context) => {
  const store = getStore("memo-calendar");
  const KEY = "data";

  if (req.method === "GET") {
    const data = await store.get(KEY, { type: "json" });
    return new Response(JSON.stringify(data ?? null), {
      headers: { "content-type": "application/json" },
    });
  }

  if (req.method === "POST") {
    try {
      const body = await req.json();
      body.updatedAt = new Date().toISOString();
      await store.setJSON(KEY, body);
      return new Response(JSON.stringify({ ok: true, updatedAt: body.updatedAt }), {
        headers: { "content-type": "application/json" },
      });
    } catch (e) {
      return new Response(JSON.stringify({ ok: false, error: String(e) }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }
  }

  return new Response("Method Not Allowed", { status: 405 });
};

export const config: Config = {
  path: "/api/schedule",
};
