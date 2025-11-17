// With `output: 'static'` configured:
//export const prerender = false;
import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ cookies, redirect }) => {
  cookies.delete("sb-access-token", { path: "/Dashboard_PT/" });
  cookies.delete("sb-refresh-token", { path: "/Dashboard_PT/" });
  return redirect("/Dashboard_PT/");
};