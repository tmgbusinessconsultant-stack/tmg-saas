UPDATE "User"
SET "permissions" = ARRAY(
  SELECT DISTINCT permission
  FROM unnest("permissions" || ARRAY['projects:create', 'projects:read', 'projects:update']::TEXT[]) AS permissions(permission)
  ORDER BY permission
)
WHERE "role" = 'CLIENT';
