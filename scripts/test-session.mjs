import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
import axios from 'axios';

const storage = new Map();
globalThis.localStorage = {
  getItem: key => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, String(value)),
  removeItem: key => storage.delete(key),
};
let redirects = 0;
globalThis.window = { location: { assign: () => { redirects++; } } };
let refreshCalls = 0;
let uploads = 0;
let rejectRefresh = false;
axios.defaults.adapter = async config => {
  const success = data => ({ data, status: 200, statusText: 'OK', config, headers: {} });
  if (config.url === '/auth/login/') {
    assert.equal(config.headers.Authorization, undefined);
    return success({ access: 'expired', refresh: 'valid-refresh', user: { id: 'user-1' } });
  }
  if (config.url === '/auth/refresh/') {
    refreshCalls++;
    assert.equal(config.headers.Authorization, undefined);
    assert.equal(JSON.parse(config.data).refresh, 'valid-refresh');
    if (rejectRefresh) throw new axios.AxiosError('Expired refresh', '', config, null, { status: 401, config });
    await new Promise(resolve => setTimeout(resolve, 10));
    return success({ access: 'renewed' });
  }
  if (config.headers.Authorization !== 'Bearer renewed') {
    throw new axios.AxiosError('Expired access', '', config, null, { status: 401, config });
  }
  if (config.url === '/summarize/') {
    assert.ok(config.data instanceof FormData);
    uploads++;
    return success({ summary: 'Document summary' });
  }
  return success({ id: 'user-1' });
};
let source = await readFile(new URL('../src/api/paperiqApi.tsx', import.meta.url), 'utf8');
source = source.replace('import.meta.env.VITE_API_BASE_URL', 'undefined');
let js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
js = js.replace('from "axios"', `from ${JSON.stringify(import.meta.resolve('axios'))}`);
const api = await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`);
await api.loginUser('test@example.com', 'password');
assert.equal(storage.get('refreshToken'), 'valid-refresh');
const file = new Blob(['PaperIQ session regression test.'], { type: 'text/plain' });
const results = await Promise.all([api.summarizeFile(file), api.getCurrentUser()]);
assert.equal(results[0].summary, 'Document summary');
assert.equal(refreshCalls, 1, 'Concurrent failures share a refresh');
assert.equal(uploads, 1, 'Upload succeeds once after retry');
assert.equal(redirects, 0);
storage.set('accessToken', 'expired');
rejectRefresh = true;
await assert.rejects(api.getCurrentUser());
assert.equal(redirects, 1);
assert.equal(storage.has('refreshToken'), false);
await api.loginUser('test@example.com', 'password');
assert.equal(storage.get('refreshToken'), 'valid-refresh');
api.logoutUser();
assert.equal(storage.has('refreshToken'), false);
console.log('Session regression checks passed: renewal, concurrent retry, upload replay, expired session, login and logout.');
