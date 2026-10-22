import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { ConnectionStatus, ConversationMessage } from '../src/types/voice.js';
import { VoiceServiceMock } from '../src/services/VoiceServiceMock.js';

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

test('connection subscribers receive the current state and can unsubscribe', async () => {
  const service = new VoiceServiceMock();
  const statuses: ConnectionStatus[] = [];

  const unsubscribe = service.onConnectionChange((status) => statuses.push(status));
  assert.deepEqual(statuses, ['disconnected']);

  unsubscribe();
  await service.connect();
  await service.disconnect();

  assert.deepEqual(statuses, ['disconnected']);
});

test('connect, listening, and disconnect update the exposed state', async () => {
  const service = new VoiceServiceMock();
  const connectionStates: ConnectionStatus[] = [];
  const conversationStates: string[] = [];
  const messages: ConversationMessage[] = [];

  service.onConnectionChange((status) => connectionStates.push(status));
  service.onConversationStatusChange((status) => conversationStates.push(status));
  service.onMessage((message) => messages.push(message));

  await service.connect();

  assert.deepEqual(connectionStates, ['disconnected', 'connecting', 'connected']);
  assert.equal(messages.length, 1);
  assert.equal(messages[0]?.speaker, 'system');
  assert.match(messages[0]?.text ?? '', /Connected to Opal Voice Foundation/);

  service.startListening();
  assert.equal(conversationStates.at(-1), 'listening');

  service.stopListening();
  assert.equal(conversationStates.at(-1), 'idle');

  await service.disconnect();
  assert.equal(connectionStates.at(-1), 'disconnected');
});

test('text messages produce a user message and a placeholder reply', async () => {
  const service = new VoiceServiceMock();
  const messages: ConversationMessage[] = [];
  const conversationStates: string[] = [];

  service.onMessage((message) => messages.push(message));
  service.onConversationStatusChange((status) => conversationStates.push(status));

  await service.connect();
  service.sendTextMessage('  hello  ');

  assert.equal(messages.length, 2);
  assert.equal(messages[1]?.speaker, 'user');
  assert.equal(messages[1]?.text, 'hello');
  assert.equal(conversationStates.at(-1), 'processing');

  await sleep(700);

  assert.equal(messages.length, 3);
  assert.equal(messages[2]?.speaker, 'assistant');
  assert.match(messages[2]?.text ?? '', /Foundation Placeholder/);
  assert.equal(conversationStates.at(-1), 'idle');

  await service.disconnect();
});
