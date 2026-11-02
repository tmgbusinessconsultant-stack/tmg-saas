import assert from 'node:assert/strict';
import { test } from 'node:test';

const apiUrl = process.env.CMS_E2E_API_URL?.trim().replace(/\/+$/, '');
const adminToken = process.env.CMS_E2E_ADMIN_TOKEN;

test('Super Admin can upload and delete a private CMS media object', {
  skip: apiUrl && adminToken ? false : 'Set CMS_E2E_API_URL and CMS_E2E_ADMIN_TOKEN from an isolated staging environment.',
}, async () => {
  const baseUrl = apiUrl!.endsWith('/api') ? apiUrl! : `${apiUrl}/api`;
  const image = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l7sAAAAASUVORK5CYII=',
    'base64',
  );
  const form = new FormData();
  form.append('file', new Blob([image], { type: 'image/png' }), 'cms-e2e.png');
  form.append('location', '');

  const uploadResponse = await fetch(`${baseUrl}/admin/content/media`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: form,
  });
  assert.equal(uploadResponse.status, 201);
  const uploaded: unknown = await uploadResponse.json();
  assert.ok(uploaded && typeof uploaded === 'object' && 'id' in uploaded && typeof uploaded.id === 'string');
  const mediaId = uploaded.id;

  try {
    assert.equal(Reflect.get(uploaded, 'status'), 'SCANNING');
  } finally {
    const deleteResponse = await fetch(`${baseUrl}/admin/content/media/${encodeURIComponent(mediaId)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(deleteResponse.status, 200);
  }
});
