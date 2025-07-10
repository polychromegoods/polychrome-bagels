import { shopify } from '~/shopify.server';

const CREATE_VARIANT_MUTATION = `
  mutation CreateVariant($productId: ID!, $variantTitle: String!) {
    productVariantsBulkCreate(
      productId: $productId
      variants: [
        {
          optionValues: [{ name: "Custom", optionName: $variantTitle }]
          price: "0.00"
        }
      ]
    ) {
      productVariants {
        id
        title
      }
      userErrors {
        field
        message
      }
    }
  }
`;

// hardcoded product ID (from your working GraphQL tests)
const PRODUCT_ID = 'gid://shopify/Product/7587570221142';

export async function createVariant(variantTitle: string) {
  const { admin } = shopify;

  const response = await admin.graphql(CREATE_VARIANT_MUTATION, {
    variables: {
      productId: PRODUCT_ID,
      variantTitle,
    },
  });

  const data = await response.json();

  if (data.errors?.length) {
    console.error('GraphQL errors:', data.errors);
    throw new Error('GraphQL error creating variant');
  }

  if (data.data?.productVariantsBulkCreate?.userErrors?.length) {
    console.error('User errors:', data.data.productVariantsBulkCreate.userErrors);
    throw new Error('Shopify user error creating variant');
  }

  return data.data.productVariantsBulkCreate.productVariants?.[0] ?? null;
}
