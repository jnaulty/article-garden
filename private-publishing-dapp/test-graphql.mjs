import { SuiGraphQLClient } from "@mysten/sui/graphql";
import { graphql } from "@mysten/sui/graphql/schemas/2024.4";

const client = new SuiGraphQLClient({
  url: "https://graphql.testnet.sui.io/graphql",
});

const packageId = "0xf72cca43c73677a73f53a7536e92c34b68d2eb8e4d5f4e6fbadf5501850995f3";
const publicationId = "0xfd5db4ac5ac878972f3c4eae48e657a4f0955b594352223b1ce06ea47db1daa1";

console.log("Testing FIXED GraphQL queries...\n");

// Test 1: Query all publications with CORRECT syntax
const typeFilter = `${packageId}::publication::Publication`;
const queryAll = graphql(`
  query GetPublications($typeFilter: String!) {
    objects(
      filter: {
        type: $typeFilter
      }
    ) {
      nodes {
        address
        asMoveObject {
          contents {
            json
          }
        }
      }
    }
  }
`);

try {
  console.log("1. Querying all publications with FIXED syntax...");
  const resultAll = await client.query({
    query: queryAll,
    variables: { typeFilter },
  });

  const nodeCount = resultAll.data?.objects.nodes.length || 0;
  console.log(`✅ Found ${nodeCount} publications`);
  if (nodeCount > 0) {
    resultAll.data.objects.nodes.forEach((node, i) => {
      console.log(`  ${i + 1}. ${node.address}`);
      if (node.asMoveObject?.contents?.json) {
        const data = node.asMoveObject.contents.json;
        console.log(`     Name: ${data.name}`);
      }
    });
  } else {
    console.log("❌ No publications found - this should not happen!");
  }
} catch (error) {
  console.error("❌ Error querying all publications:", error.message);
}

// Test 2: Query specific publication
const queryOne = graphql(`
  query GetPublication($id: SuiAddress!) {
    object(address: $id) {
      address
      asMoveObject {
        contents {
          json
        }
      }
    }
  }
`);

try {
  console.log(`\n2. Querying specific publication ${publicationId}...`);
  const resultOne = await client.query({
    query: queryOne,
    variables: { id: publicationId },
  });

  if (resultOne.data?.object) {
    console.log("Found!");
    console.log(JSON.stringify(resultOne.data.object.asMoveObject?.contents?.json, null, 2));
  } else {
    console.log("NOT FOUND - likely indexing delay");
  }
} catch (error) {
  console.error("Error querying specific publication:", error.message);
}
