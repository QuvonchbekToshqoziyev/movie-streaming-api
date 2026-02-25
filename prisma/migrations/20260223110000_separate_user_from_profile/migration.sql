ALTER TABLE "Profile"
ADD COLUMN "avatar_url" TEXT NOT NULL DEFAULT '';

UPDATE "Profile" p
SET "avatar_url" = u."avatar_url"
FROM "User" u
WHERE p."userId" = u."id";

ALTER TABLE "User"
DROP COLUMN "avatar_url";
