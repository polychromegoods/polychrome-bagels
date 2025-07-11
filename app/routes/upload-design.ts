// app/routes/_index/upload-design.ts

import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { authenticate } from "~/shopify.server";

export async function action({ request }: ActionFunctionArgs) {
  const headers = new Headers();
  // IMPORTANT: Replace with your specific Netlify frontend URL in production
  headers.append("Access-Control-Allow-Origin", "https://gorgeous-torrone-d73d15.netlify.app");
  headers.append("Access-Control-Allow-Methods", "POST, OPTIONS"); // Allow POST and OPTIONS for preflight
  headers.append("Access-Control-Allow-Headers", "Content-Type, Authorization"); // Add any headers your frontend sends
  headers.append("Access-Control-Allow-Credentials", "true"); // If you're sending cookies/auth headers
  headers.append("Access-Control-Max-Age", "86400"); // Cache preflight requests for 24 hours

  if (request.method === "OPTIONS") {
    // Handle CORS preflight requests
    return new Response(null, { status: 204, headers: headers }); // 204 No Content for successful preflight
  }

  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers: headers });
  }

  const { admin } = await authenticate.admin(request);

  try {
    const body = await request.json();
    const { variantTitle, productId } = body;

    if (!variantTitle || !productId) {
      return json(
        { error: "Missing variantTitle or productId in request body." },
        { status: 400, headers: headers } // Return with CORS headers
      );
    }

    const response = await admin.graphql(
      // ... your GraphQL mutation ...
      `#graphql
      mutation productVariantCreate($productId: ID!, $input: ProductVariantInput!) {
        productVariantCreate(productId: $productId, input: $input) {
          productVariant {
            id
            title
            price
          }
          userErrors {
            field
            message
          }
        }
      }`,
      { variables: { productId, input: { title: variantTitle } } }
    );

    const responseJson = await response.json();

    if (responseJson.errors || responseJson.data?.productVariantCreate?.userErrors.length) {
      console.error("Shopify API error creating variant:", responseJson.errors || responseJson.data.productVariantCreate.userErrors);
      return json(
        {
          error: "Failed to create variant via Shopify API.",
          details: responseJson.errors || responseJson.data.productVariantCreate.userErrors,
        },
        { status: 500, headers: headers } // Return with CORS headers
      );
    }

    const createdVariant = responseJson.data.productVariantCreate.productVariant;
    console.log("Variant created successfully:", createdVariant);

    return json({
      message: "Variant created successfully!",
      variant: createdVariant,
    }, { status: 200, headers: headers }); // Return with CORS headers

  } catch (error) {
    console.error("Error in /api/upload-design:", error);
    return json(
      { error: "Internal Server Error", details: error instanceof Error ? error.message : "An unknown error occurred." },
      { status: 500, headers: headers } // Return with CORS headers
    );
  }
}