-- Vytvoření nového testovacího uživatele pro registraci
INSERT INTO "User" (
  "id",
  "email", 
  "whatsappPhone",
  "whatsappVerified",
  "isProfileComplete", 
  "registrationStep",
  "firstName",
  "lastName",
  "name",
  "createdAt",
  "updatedAt"
) VALUES (
  'test_user_registration_' || substr(hex(randomblob(8)), 1, 16),
  'test@registration.com',
  NULL, -- Bude nastaveno při aktivaci
  false,
  false,
  0,
  NULL, -- Bude sbíráno při registraci
  NULL, -- Bude sbíráno při registraci
  NULL, -- Bude kombinováno z firstName + lastName
  datetime('now'),
  datetime('now')
);

-- Vytvoření aktivačního kódu pro testování
INSERT INTO "ActivationCode" (
  "id",
  "code",
  "userId",
  "used",
  "expiresAt",
  "createdAt"
) VALUES (
  'test_activation_' || substr(hex(randomblob(8)), 1, 16),
  'TEST-REG-' || substr(hex(randomblob(4)), 1, 8),
  (SELECT "id" FROM "User" WHERE "email" = 'test@registration.com' ORDER BY "createdAt" DESC LIMIT 1),
  false,
  datetime('now', '+7 days'),
  datetime('now')
);

-- Zobrazení vytvořeného kódu
SELECT 
  u."email",
  ac."code" as "Activation Code",
  ac."expiresAt",
  u."registrationStep"
FROM "ActivationCode" ac
JOIN "User" u ON ac."userId" = u."id" 
WHERE u."email" = 'test@registration.com'
ORDER BY ac."createdAt" DESC 
LIMIT 1;