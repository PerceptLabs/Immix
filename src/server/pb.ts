import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.PB_URL);

export default pb;
