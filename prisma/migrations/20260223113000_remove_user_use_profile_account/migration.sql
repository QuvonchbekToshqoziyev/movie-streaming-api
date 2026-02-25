ALTER TABLE "Profile"
ADD COLUMN "username" TEXT,
ADD COLUMN "email" TEXT,
ADD COLUMN "password" TEXT,
ADD COLUMN "role" "Role" NOT NULL DEFAULT 'USER';

UPDATE "Profile" p
SET
  "username" = u."username",
  "email" = u."email",
  "password" = u."password",
  "role" = u."role"
FROM "User" u
WHERE p."userId" = u."id";

ALTER TABLE "Profile"
ALTER COLUMN "username" SET NOT NULL,
ALTER COLUMN "email" SET NOT NULL,
ALTER COLUMN "password" SET NOT NULL;

CREATE UNIQUE INDEX "Profile_username_key" ON "Profile"("username");
CREATE UNIQUE INDEX "Profile_email_key" ON "Profile"("email");

ALTER TABLE "Profile" DROP COLUMN "userId" CASCADE;
ALTER TABLE "Admin" DROP COLUMN IF EXISTS "userId";
DROP TABLE IF EXISTS "User";
