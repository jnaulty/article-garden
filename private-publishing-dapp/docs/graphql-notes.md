# Sui GraphQL API - Notes & Troubleshooting

This document contains important notes about working with the Sui GraphQL API, including common issues and solutions.

## Table of Contents

- [Type Filter Syntax](#type-filter-syntax)
- [Common Issues](#common-issues)
- [Testing Queries](#testing-queries)
- [Resources](#resources)

## Type Filter Syntax

### IMPORTANT: Type Filter Format

The Sui GraphQL API expects the `type` filter to be a **string**, not an object.

### Incorrect Syntax (Will Fail)

```typescript
// ❌ This will NOT work - returns validation error
const query = graphql(`
  query GetPublications($packageId: SuiAddress!) {
    objects(
      filter: {
        type: {
          package: $packageId,
          module: "publication",
          name: "Publication"
        }
      }
    ) {
      nodes { ... }
    }
  }
`);
```

**Error Message:**
```json
{
  "errors": [{
    "message": "Invalid value for argument \"filter.type\", expected type \"String\""
  }]
}
```

### Correct Syntax (Works)

```typescript
// ✅ This WORKS - type filter as a string
export async function fetchAllPublications(packageId: string): Promise<Publication[]> {
  const typeFilter = `${packageId}::publication::Publication`;

  const query = graphql(`
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

  const result = await suiGraphQLClient.query({
    query,
    variables: { typeFilter },
  });

  // ... process results
}
```

### Type String Format

The type string must follow this format:

```
<PACKAGE_ID>::<MODULE_NAME>::<TYPE_NAME>
```

**Examples:**
- `0xf72cca43c73677a73f53a7536e92c34b68d2eb8e4d5f4e6fbadf5501850995f3::publication::Publication`
- `0xf72cca43c73677a73f53a7536e92c34b68d2eb8e4d5f4e6fbadf5501850995f3::article::Article`
- `0xf72cca43c73677a73f53a7536e92c34b68d2eb8e4d5f4e6fbadf5501850995f3::subscription::SubscriptionNFT`

## Common Issues

### Issue 1: Objects Not Appearing in Queries

**Symptom:** You create an object on-chain (confirmed via transaction), but it doesn't appear in GraphQL queries.

**Possible Causes:**

1. **Incorrect Type Filter Syntax** (Most Common)
   - See [Type Filter Syntax](#type-filter-syntax) above
   - Solution: Use string format for type filter

2. **GraphQL Indexing Delay**
   - The GraphQL indexer may take a few seconds to index new objects
   - Solution: Wait 5-10 seconds and refresh

3. **Wrong Network**
   - Your app might be querying a different network than where you created the object
   - Solution: Check `networkConfig` and ensure the app uses the correct network

4. **Wrong Package ID**
   - The package ID in your query doesn't match the actual deployed package
   - Solution: Verify the package ID matches the transaction's `objectType`

### Issue 2: Direct Query Works But Filter Doesn't

**Symptom:** Querying by object ID works, but filtering by type returns 0 results.

```graphql
# ✅ This works
query GetPublication($id: SuiAddress!) {
  object(address: $id) {
    asMoveObject { contents { json } }
  }
}

# ❌ This returns empty
query GetPublications {
  objects(filter: { type: { ... } }) {
    nodes { ... }
  }
}
```

**Solution:** This is almost always due to incorrect type filter syntax. Change to string format:

```graphql
query GetPublications($typeFilter: String!) {
  objects(filter: { type: $typeFilter }) {
    nodes { ... }
  }
}
```

## Testing Queries

### Using GraphQL Playground

1. Open GraphQL playground: https://graphql.testnet.sui.io/graphql
2. Test your query directly:

```graphql
query GetPublications {
  objects(
    filter: {
      type: "0xf72cca43c73677a73f53a7536e92c34b68d2eb8e4d5f4e6fbadf5501850995f3::publication::Publication"
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
```

3. If it works in the playground but not in your app, the issue is in your client code

### Using Test Script

Create a Node.js test script to verify queries:

```javascript
import { SuiGraphQLClient } from "@mysten/sui/graphql";
import { graphql } from "@mysten/sui/graphql/schemas/2024.4";

const client = new SuiGraphQLClient({
  url: "https://graphql.testnet.sui.io/graphql",
});

const typeFilter = "0xYOUR_PACKAGE::module::Type";

const query = graphql(`
  query Test($typeFilter: String!) {
    objects(filter: { type: $typeFilter }) {
      nodes { address }
    }
  }
`);

const result = await client.query({
  query,
  variables: { typeFilter },
});

console.log(result.data);
```

### Debugging Checklist

When GraphQL queries fail:

- [ ] Check the type filter format (string vs object)
- [ ] Verify package ID matches deployed package
- [ ] Confirm object exists via transaction lookup
- [ ] Test query in GraphQL playground
- [ ] Check network configuration
- [ ] Wait for indexing delay (5-10 seconds)
- [ ] Review browser/server console for errors

## Resources

- **GraphQL Playground:** https://graphql.testnet.sui.io/graphql
- **Sui GraphQL Docs:** https://docs.sui.io/guides/developer/getting-started/graphql-rpc
- **Schema Documentation:** Available in GraphQL playground (Docs button)
- **Example Queries:** See `src/utils/graphqlQueries.ts` in this project

## Version Notes

This documentation is based on:
- Sui GraphQL Schema: `2024.4`
- `@mysten/sui` package: Latest version as of project creation
- Testnet endpoint: `https://graphql.testnet.sui.io/graphql`

## Contributing

If you discover additional issues or solutions, please update this document!
