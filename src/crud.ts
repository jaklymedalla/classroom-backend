import { eq } from "drizzle-orm";
import { db } from "./db/index.js";
import { demoUsers } from "./db/schema/index.js";

async function main() {
  console.log("Performing CRUD operations...");

  const [newUser] = await db
    .insert(demoUsers)
    .values({
      name: "Admin User",
      email: `admin-${Date.now()}@example.com`,
    })
    .returning();

  if (!newUser) {
    throw new Error("Failed to create user");
  }
  console.log("CREATE:", newUser);

  try {
    const [foundUser] = await db
      .select()
      .from(demoUsers)
      .where(eq(demoUsers.id, newUser.id));
    if (!foundUser) {
      throw new Error("Failed to find the created user");
    }
    console.log("READ:", foundUser);

    const [updatedUser] = await db
      .update(demoUsers)
      .set({ name: "Super Admin" })
      .where(eq(demoUsers.id, newUser.id))
      .returning();
    if (!updatedUser) {
      throw new Error("Failed to update user");
    }
    console.log("UPDATE:", updatedUser);

    await db.delete(demoUsers).where(eq(demoUsers.id, newUser.id));
    console.log("DELETE: User deleted.");
  } catch (error) {
    await db.delete(demoUsers).where(eq(demoUsers.id, newUser.id));
    throw error;
  }
}

main().catch((error: unknown) => {
  console.error("Error performing CRUD operations:", error);
  process.exitCode = 1;
});
