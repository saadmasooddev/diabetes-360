-- Keycloak SSO: provider value and external identity mapping (3NF — identities live outside `users`)

ALTER TYPE provider_enum ADD VALUE IF NOT EXISTS 'keycloak';

CREATE TABLE IF NOT EXISTS user_keycloak_ids (
	user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	keycloak_sub TEXT NOT NULL,
	created_at TIMESTAMP NOT NULL DEFAULT NOW(),
	PRIMARY KEY (user_id, keycloak_sub)
);

CREATE UNIQUE INDEX IF NOT EXISTS user_keycloak_ids_keycloak_sub_unique ON user_keycloak_ids (keycloak_sub);
