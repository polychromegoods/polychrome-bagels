// app/routes/upload-design.ts

import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "~/shopify.server";
import { productCreator } from "~/lib/productCreator.server";

export async function action({ request }: ActionFunctionArgs) {
  const { session } = await authenticate.admin(request);

  const { variantTitle } = await request.json();
  if (!variantTitle) {
    return new Response("Missing variantTitle", { status: 400 });
  }

  try {
    const created = await productCreator({ session, variantTitle });
    return new Response(JSON.stringify(created), { status: 200 });
  } catch (error) {
    console.error("Upload design failed", error);
    return new Response("Internal error", { status: 500 });
  }
}
