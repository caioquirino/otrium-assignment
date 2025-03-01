# Otrium Loyalty Program - Database

## Database Choice and Design Rationale

This section explains the reasoning behind selecting DynamoDB and adopting a single-table design for the Otrium loyalty program's data storage.

### Why DynamoDB?

DynamoDB, a fully managed NoSQL database service offered by AWS, was chosen for the following key reasons:

- **Scalability and Performance:** DynamoDB is designed to handle massive workloads with predictable, low-latency performance. This is crucial for an e-commerce loyalty program, which may experience significant spikes in traffic during sales events or promotions. DynamoDB's automatic scaling capabilities ensure that the system can handle these peaks without performance degradation.
- **Serverless:** DynamoDB integrates seamlessly with other AWS serverless services like Lambda and API Gateway, which are used extensively in this architecture. This reduces operational overhead and allows the team to focus on building features rather than managing infrastructure.
- **Cost-Effectiveness:** DynamoDB offers a pay-per-use pricing model (with on-demand capacity mode), which can be very cost-effective for applications with variable workloads. The ability to scale resources up and down automatically helps to optimize costs.
- **Flexible Schema:** DynamoDB's NoSQL nature allows for a flexible schema. While we have a well-defined schema for the core loyalty data, we can easily add new attributes or data structures in the future without requiring complex schema migrations.
- **High Availability and Durability:** DynamoDB is designed for high availability and durability, with data replicated across multiple Availability Zones. This ensures that the loyalty program data is protected against failures.
- **Transactional Capabilities:** DynamoDB supports ACID transactions, critical for use-cases, where data integrity and consistency are paramount.

### Why Single-Table Design?

The loyalty program data is stored in a single DynamoDB table (`LoyaltyPoints`) using a single-table design. This approach, while seemingly counterintuitive for those coming from a relational database background, is a best practice for DynamoDB and offers several advantages:

- **Performance:** In DynamoDB, retrieving data from a single table is generally _faster_ than joining data across multiple tables (as you would do in a relational database). Single-table designs minimize the number of requests needed to retrieve related data. All data related to a user's loyalty information is stored in a single item, making retrieval very efficient.
- **Scalability:** Single-table designs are inherently more scalable in DynamoDB. By co-locating related data within a single item (using the `userId` as the partition key), we ensure that all data for a given user resides on the same partition, minimizing cross-partition queries.
- **Simplified Queries:** The most common access pattern (retrieving a user's points balance and history) can be satisfied with a simple `GetItem` operation using the `userId`. This avoids the complexity of joins or multiple queries.
- **Cost Optimization:** Single-table designs can often be more cost-effective in DynamoDB because they reduce the number of read and write operations required.
- **ACID Transactions:** With the single table design, we can use DynamoDB transactions to ensure atomicity, consistency, isolation, and durability across multiple operations.

The single-table design, with `userId` as the partition key, is optimized for the primary access patterns of the loyalty program: retrieving a user's points balance and updating points after a purchase. While more complex queries might require Global Secondary Indexes (GSIs) in the future, the initial design prioritizes simplicity, performance, and cost-effectiveness for the core functionality. The use of nested attributes (like the `rewardHistory` list) allows us to store related data together within a single item, further enhancing performance.

## DynamoDB Table: `LoyaltyPoints`

This table stores data for the Otrium loyalty program.

### Schema

| Attribute Name                  | Data Type | Key Type      | Description                                                                                                                                                       |
| ------------------------------- | --------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `userId`                        | String    | Partition Key | The unique identifier for the user. This is the primary key and is used to look up a user's loyalty data.                                                         |
| `points`                        | Number    |               | The user's current point balance.                                                                                                                                 |
| `lastUpdated`                   | Number    |               | A timestamp (Unix epoch milliseconds) of the last time the `points` value was updated. Used for debugging, auditing, and optimistic locking (conditional writes). |
| `rewardHistory`                 | List      |               | A list of historical transactions. Each element in the list is a map (object) representing a single transaction.                                                  |
| `rewardHistory[].transactionId` | String    |               | A unique ID for this specific transaction. Crucial for idempotency (preventing duplicate processing of the same event).                                           |
| `rewardHistory[].type`          | String    |               | Either `"EARN"` or `"REDEEM"`, indicating whether points were added or subtracted.                                                                                |
| `rewardHistory[].amount`        | Number    |               | The number of points earned or redeemed in this transaction.                                                                                                      |
| `rewardHistory[].timestamp`     | Number    |               | Timestamp of the transaction.                                                                                                                                     |
| `rewardHistory[].orderId`       | String    |               | (Optional) The ID of the order associated with the transaction (for "EARN" transactions). Links the loyalty points to the specific purchase.                      |
| `rewardHistory[].description`   | String    |               | (Optional) A human-readable description (e.g., "Points earned for order #12345").                                                                                 |
| `tier`                          | String    |               | The user's current loyalty tier (e.g., "Bronze", "Silver", "Gold").                                                                                               |

### Design Rationale

- **`userId` as Partition Key:** Using `userId` as the partition key provides efficient lookups for a user's loyalty data. All operations related to a specific user will be fast because they target a single partition.
- **`points` as a Simple Attribute:** The current point balance is stored as a simple numeric attribute for easy retrieval and updates.
- **`lastUpdated` for Optimistic Locking:** The `lastUpdated` attribute enables optimistic locking using DynamoDB's conditional writes. This prevents race conditions when multiple processes might try to update a user's points concurrently.
- **`rewardHistory` as a List:** Storing the transaction history as a list of maps within the user's item provides a complete audit trail. This is important for:
  - Debugging any issues with point calculations.
  - Providing users with a detailed history of their transactions.
  - Potentially supporting reporting and analytics.
- **`tier`**: Stores information about the user's tier.

- **No Sort Key:** In this design, we _don't_ use a sort key. All primary access patterns are based on the `userId` (partition key). This simplifies the main operations.

### Global Secondary Indexes (GSIs)

**Initially, we _don't_ define any GSIs.** The primary access patterns (described below) can be efficiently served using the primary key (`userId`).

**Potential Future GSIs (if needed):**

1.  **`tier-index` (GSI):**

    - **Partition Key:** `tier` (String)
    - **Projected Attributes:** `userId`, `points` (and potentially others, depending on needs)
    - **Use Case:** If we need to efficiently query for all users within a specific loyalty tier (e.g., to send targeted promotions to "Gold" members), this GSI would be useful.
    - **Write access pattern**: When updating the points, we should verify the tier and update it.
    - **Read access pattern**: Read users by tier.

2.  **`rewardHistory-orderId-index` (GSI):**
    - **Partition Key:** `orderId`
    - **Sort Key:** `timestamp`
    - **Projected attributes:** `userId`,`transactionId`
    - **Use Case:** This GSI is useful to verify if an order has already been processed or not.
    - **Write access pattern**: When processing a new event, verify if the transaction already exists in the system.
    - **Read access pattern**: Read transaction by order id.

Adding GSIs adds cost and complexity, so we would only add them if specific query requirements arise that cannot be efficiently served by the primary key. We should carefully analyze the access patterns before adding GSIs.

### Access Patterns

**Write Access Patterns:**

1.  **Update Points (Most Frequent):**
    - **Operation:** `UpdateItem` on the `LoyaltyPoints` table.
    - **Key:** `userId` (partition key).
    - **Attributes Updated:** `points`, `lastUpdated`, `rewardHistory`.
    - **Condition:** Use a `ConditionExpression` to ensure that the `lastUpdated` attribute hasn't changed since we last read it (optimistic locking). Also, check the `rewardHistory` to ensure idempotency (using the `transactionId`).
    - **Frequency:** High (every purchase).
2.  **Update Tier (Less Frequent):**
    - **Operation**: `UpdateItem` on the `LoyaltyPoints` table.
    - **Key:** `userId` (partition key).
    - **Attributes Updated:** `tier`
    - **Frequency:** Occasional (every time a user changes tier).

**Read Access Patterns:**

1.  **Get User's Points Balance (Most Frequent):**
    - **Operation:** `GetItem` on the `LoyaltyPoints` table.
    - **Key:** `userId` (partition key).
    - **Attributes Retrieved:** `points` (primarily), and potentially `tier`.
    - **Frequency:** Very High (every time a user views their profile, checks out, etc.).
2.  **Get User by Tier (Less Frequent):**
    - **Operation:** `Query` on the `tier-index` table.
    - **Key:** `tier` (partition key).
    - **Attributes Retrieved:** `userId`, `points`.
    - **Frequency:** Occasional
3.  **Get User's Reward History (Less Frequent):**
    - **Operation:** `GetItem` on the `LoyaltyPoints` table.
    - **Key:** `userId` (partition key).
    - **Attributes Retrieved:** `rewardHistory` (and potentially other attributes).
    - **Frequency:** Low (only when a user views their detailed transaction history). This operation becomes _more expensive_ as the `rewardHistory` grows. Consider archiving old history to a separate table if it becomes excessively large.
4.  **Get transaction by Order ID**
    - **Operation:** `Query` on the `rewardHistory-orderId-index` table.
    - **Key:** `orderId` (partition key).
    - **Attributes Retrieved:** `userId`, `transactionId`.
    - **Frequency:** Occasional.

This table schema and the documented access patterns provide a clear and well-defined structure for the loyalty program data in DynamoDB. The design prioritizes efficiency for the most common operations (updating and retrieving points) while providing a mechanism for auditing and potential future extensions. The use of optimistic locking ensures data consistency, and the lack of initial GSIs keeps the design simple and cost-effective until more complex query requirements arise.

## Limitations

### DynamoDB Item Size Estimation for `rewardHistory`

This section provides a concise estimate of the number of transactions that can be stored within the `rewardHistory` attribute of the `LoyaltyPoints` DynamoDB table before approaching the 400 KB item size limit.

#### Attribute Size Estimates

| Attribute                                 | Data Type | Estimated Size (Bytes) | Notes                                  |
| ----------------------------------------- | --------- | ---------------------- | -------------------------------------- |
| `transactionId`                           | String    | 36                     | UUID                                   |
| `type`                                    | String    | 5                      | "EARN" or "REDEEM"                     |
| `amount`                                  | Number    | 8                      | Double-precision floating-point        |
| `timestamp`                               | Number    | 8                      | Unix timestamp (milliseconds)          |
| `orderId`                                 | String    | 36                     | UUID                                   |
| `description`                             | String    | 200                    | Average estimated size                 |
| Attribute Name Overhead                   | -         | 60                     | ~10 bytes per attribute (6 attributes) |
| **Total per Transaction**                 |           | **353**                |                                        |
| `userId`, `points`, `lastUpdated`, `tier` |           | 100                    | Includes all the overhead.             |

#### Estimation

- **DynamoDB Item Size Limit:** 400 KB (409,600 bytes)
- **Space for Other Attributes**: 100 bytes
- **Available Space for `rewardHistory`:** 409,600 - 100 = 409,500 bytes
- **Estimated Transactions:** 409,500 bytes / 353 bytes/transaction ≈ **1160 transactions**

#### Conclusion

Based on these estimates, the `rewardHistory` list can store approximately **1160 transactions** before approaching the DynamoDB item size limit. **Therefore, an archiving strategy for older transactions is essential for long-term operation.** Monitoring the item size in production is crucial.

#### Alternative GSI Design for storing more items

Create a Global Secondary Index (GSI) with `transactionId` as the partition key:

- **Index Name:** `transactionId-index`
- **Partition Key:** `transactionId` (String)
- **Sort Key:** (None)
- **Projected Attributes:** Include all necessary attributes (`userId`, `type`, `amount`, `timestamp`, `orderId`, `description`).

**_Rationale:_**

- **Universality:** Every transaction, regardless of type ("EARN" or "REDEEM"), has a unique `transactionId`. This GSI will therefore index _all_ transactions.
- **Efficient Lookup:** Allows for efficient retrieval of any transaction by its `transactionId` using a `Query` operation on the `transactionId-index`.
- **Avoid hot partitions:** Using the `transactionId` we ensure that write operations will be distributed across multiple partitions.

**_Trade-off:_**

- This approach loses the ability to directly query for all transactions associated with a specific `orderId` using this GSI. If that's a frequent requirement, the original `orderId` GSI (sparse) could be kept _in addition_ to this `transactionId` GSI, or the application logic could be adjusted to first retrieve the relevant `transactionId`s and then use the `transactionId-index`. Or archiving solution can be used.
- **Cost:** Additional storage and write costs for the extra index.
