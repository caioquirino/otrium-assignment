import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import axios from 'axios'; // Import Axios
import { AppModule } from '@otrium-assignment/loyalty-api/src/app/app.module';
import { DynamoDBLoyaltyUserRepository } from '@otrium-assignment/shared';
import { v4 as uuidv4 } from 'uuid';

describe('Loyalty API (E2E)', () => {
  let app: INestApplication;
  let repository: DynamoDBLoyaltyUserRepository;
  let baseURL: string;

  let userIdsToDelete: Array<string> = [];

  const createTestUserId = async () => {
    const userId = uuidv4();
    // No need to pre-delete; updatePoints will create if not exists
    userIdsToDelete.push(userId);
    return userId;
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    await app.listen(0); // Listen on a random port

    repository = moduleFixture.get<DynamoDBLoyaltyUserRepository>(DynamoDBLoyaltyUserRepository);
    baseURL = await app.getUrl(); // Get the dynamically assigned base URL
  });

  afterAll(async () => {
    // Clean up DynamoDB *after* all tests
    for (const userId of userIdsToDelete) {
      await repository.deleteLoyalty(userId);
      userIdsToDelete = []
    }
    await app.close();
  });

  it('/loyalty/points/:userId (GET) - should return 0 for a nonexistent user', async () => {
    const testUserId = await createTestUserId();
    const response = await axios.get(`${baseURL}/loyalty/points/${testUserId}`);

    expect(response.status).toBe(200);
    expect(response.data).toEqual({
      userId: testUserId,
      points: 0,
    });
  });

  it('/loyalty/points/:userId (GET) - should return points for an existing user', async () => {
    const testUserId = await createTestUserId();
    const transactionId = uuidv4();
    const orderId = uuidv4();
    await repository.updatePoints(testUserId, 123, transactionId, orderId, 'Initial points');

    const response = await axios.get(`${baseURL}/loyalty/points/${testUserId}`);

    expect(response.status).toBe(200);
    expect(response.data).toEqual({
      userId: testUserId,
      points: 123,
    });
  });
  it('/loyalty/points/:userId (GET) - should return points for a nonexistent user', async () => {
    const nonExistentUserId = `non-existent-user-${uuidv4()}`
    const response = await axios.get(`${baseURL}/loyalty/points/${nonExistentUserId}`);

    expect(response.status).toBe(200);
    expect(response.data).toEqual({
      userId: nonExistentUserId,
      points: 0, // Expected points for a *new* user
    });
  });
});