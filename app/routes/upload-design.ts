// app/routes/api/upload-design.ts

import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node"; // Import json helper for consistent responses
import { authenticate } from "~/shopify.server";

// Assuming productCreator is designed to add a variant to an existing product.
// If productCreator itself creates a new product AND a variant, its signature
// and the incoming request body would need to be different.
// For the purpose of adding a variant, we need a productId.
// This example will show how to call the Shopify Admin API directly to create a variant
// to make the logic transparent and remove dependency on internal `productCreator` implementation
// that might be ambiguous.

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    // Return a 405 Method Not Allowed for non-POST requests
    return new Response("Method Not Allowed", { status: 405 });
  }

  const { admin } = await authenticate.admin(request); // Authenticate admin session

  try {
    const body = await request.json();
    // Expecting both variantTitle and productId from the frontend
    const { variantTitle, productId } = body;

    // --- Input Validation ---
    if (!variantTitle) {
      return json(
        { error: "Missing variantTitle in request body." },
        { status: 400 }
      );
    }
    if (!productId) {
      // Product ID is crucial for creating a variant on an existing product
      return json(
        { error: "Missing productId in request body. A variant must belong to a product." },
        { status: 400 }
      );
    }
    // --- End Input Validation ---

    // --- Shopify Admin API Call to Create Variant ---
    // Make sure your app's scopes include 'write_products'
    const response = await admin.graphql(
      `#graphql
      mutation productVariantCreate($productId: ID!, $input: ProductVariantInput!) {
        productVariantCreate(productId: $productId, input: $input) {
          productVariant {
            id
            title
            price
            sku
            image {
              url
            }
          }
          userErrors {
            field
            message
          }
        }
      }`,
      {
        variables: {
          productId: productId,
          input: {
            title: variantTitle,
            // Add other variant properties as needed (price, SKU, inventory, etc.)
            // For example:
            // price: "10.00",
            // inventoryPolicy: ON_DENY,
            // inventoryQuantity: 10,
            // sku: "V-" + variantTitle.replace(/\s/g, '-').toUpperCase(),
          },
        },
      }
    );

    const responseJson = await response.json();

    // Check for GraphQL errors or userErrors
    if (responseJson.errors || responseJson.data?.productVariantCreate?.userErrors.length) {
      console.error("Shopify API error creating variant:", responseJson.errors || responseJson.data.productVariantCreate.userErrors);
      return json(
        {
          error: "Failed to create variant via Shopify API.",
          details: responseJson.errors || responseJson.data.productVariantCreate.userErrors,
        },
        { status: 500 } // Or 400 if it's a client input error from Shopify's side
      );
    }

    const createdVariant = responseJson.data.productVariantCreate.productVariant;
    console.log("Variant created successfully:", createdVariant);

    // Return a successful JSON response
    return json({
      message: "Variant created successfully!",
      variant: createdVariant,
    }, { status: 200 });

  } catch (error) {
    console.error("Error in /api/upload-design:", error);
    // Return a generic error message for security, but log details
    return json(
      { error: "Internal Server Error", details: error instanceof Error ? error.message : "An unknown error occurred." },
      { status: 500 }
    );
  }
}

// Optional: Add a loader for OPTIONS preflight requests if your frontend sends them
// and your CORS configuration requires it at the route level.
// export async function loader({ request }: ActionFunctionArgs) {
//   if (request.method === "OPTIONS") {
//     const headers = new Headers();
//     // Replace with your Netlify frontend URL if applicable for direct calls
//     // For embedded apps, Shopify's internal routing usually handles it,
//     // but explicit headers can prevent issues.
//     headers.append("Access-Control-Allow-Origin", "*"); // Be specific in production!
//     headers.append("Access-Control-Allow-Methods", "POST, OPTIONS");
//     headers.append("Access-Control-Allow-Headers", "Content-Type, Authorization");
//     headers.append("Access-Control-Max-Age", "86400"); // Cache preflight for 24 hours
//     return new Response(null, { status: 204, headers: headers });
//   }
//   return new Response("Not Found", { status: 404 });
// }