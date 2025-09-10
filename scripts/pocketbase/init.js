const PocketBase = require('pocketbase/cjs');

const PB_URL = process.env.PB_URL || 'http://127.0.0.1:8090';
const ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL || 'admin@example.com';
const ADMIN_PASSWORD = process.env.PB_ADMIN_PASSWORD || '1234567890';

const collections = [
  {
    name: 'users',
    type: 'auth',
    schema: [
      { name: 'displayName', type: 'text', required: false },
      { name: 'avatar', type: 'file', required: false, maxSelect: 1 },
    ],
  },
  {
    name: 'conversations',
    type: 'base',
    schema: [
      { name: 'owner', type: 'relation', required: true, options: { collectionId: '_pb_users_auth_', maxSelect: 1 } },
      { name: 'title', type: 'text', required: false, defaultValue: 'New conversation' },
      { name: 'archived', type: 'bool', required: false, defaultValue: false },
      { name: 'lastActivity', type: 'date', required: false },
    ],
    indexes: [
      'CREATE INDEX `idx_lastActivity` ON `conversations` (`lastActivity`)',
    ],
    listRule: 'owner.id = @request.auth.id',
    viewRule: 'owner.id = @request.auth.id',
    createRule: '@request.auth.id != "" && owner = @request.auth.id',
    updateRule: 'owner.id = @request.auth.id',
    deleteRule: 'owner.id = @request.auth.id',
  },
  {
    name: 'messages',
    type: 'base',
    schema: [
      { name: 'conversation', type: 'relation', required: true, options: { collectionId: 'conversations', maxSelect: 1 } },
      { name: 'role', type: 'select', options: { values: ['system', 'user', 'assistant', 'tool'] }, required: true },
      { name: 'content', type: 'text', required: true },
      { name: 'attachments', type: 'file', required: false, maxSelect: 10 },
      { name: 'meta', type: 'json', required: false },
    ],
    indexes: [
      'CREATE INDEX `idx_conversation_created` ON `messages` (`conversation`, `created`)',
    ],
    listRule: 'conversation.owner.id = @request.auth.id',
    viewRule: 'conversation.owner.id = @request.auth.id',
    createRule: '@request.auth.id != "" && conversation.owner.id = @request.auth.id',
    updateRule: '',
    deleteRule: '',
  },
];

async function main() {
  const pb = new PocketBase(PB_URL);

  try {
    await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
    console.log('Authenticated as admin');
  } catch (err) {
    console.error('Failed to authenticate as admin.', err);
    console.log('Please ensure the PocketBase server is running and the admin credentials are correct.');
    console.log('You can create an admin account by starting the PocketBase server for the first time.');
    return;
  }

  const existingCollections = await pb.collections.getFullList();

  for (const collection of collections) {
    const existing = existingCollections.find(c => c.name === collection.name);

    if (existing) {
      console.log(`Collection "${collection.name}" already exists. Updating...`);
      try {
        await pb.collections.update(existing.id, {
          name: collection.name,
          type: collection.type,
          schema: collection.schema,
          listRule: collection.listRule,
          viewRule: collection.viewRule,
          createRule: collection.createRule,
          updateRule: collection.updateRule,
          deleteRule: collection.deleteRule,
          indexes: collection.indexes,
        });
        console.log(`Collection "${collection.name}" updated successfully.`);
      } catch (err) {
        console.error(`Failed to update collection "${collection.name}".`, err);
      }
    } else {
      console.log(`Creating collection "${collection.name}"...`);
      try {
        await pb.collections.create({
          name: collection.name,
          type: collection.type,
          schema: collection.schema,
          listRule: collection.listRule,
          viewRule: collection.viewRule,
          createRule: collection.createRule,
          updateRule: collection.updateRule,
          deleteRule: collection.deleteRule,
          indexes: collection.indexes,
        });
        console.log(`Collection "${collection.name}" created successfully.`);
      } catch (err) {
        console.error(`Failed to create collection "${collection.name}".`, err);
      }
    }
  }
}

main().catch(err => {
  console.error('An unexpected error occurred:', err);
});
