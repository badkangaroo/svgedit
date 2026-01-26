import { getStore } from "@netlify/blobs";

const memoryBlobs = new Map<string, string>();
const storeName = process.env.NETLIFY_BLOBS_STORE ?? "svgedit";

const getNetlifyStore = () => {
  const siteID = process.env.NETLIFY_SITE_ID;
  const token = process.env.NETLIFY_API_TOKEN;

  if (siteID && token) {
    return getStore({ name: storeName, siteID, token });
  }

  return getStore(storeName);
};

let cachedStore: ReturnType<typeof getStore> | null = null;

const resolveStore = () => {
  if (!cachedStore) {
    cachedStore = getNetlifyStore();
  }
  return cachedStore;
};

export type BlobStore = {
  putText: (key: string, value: string) => Promise<void>;
  getText: (key: string) => Promise<string | null>;
};

export const blobStore: BlobStore = {
  async putText(key, value) {
    try {
      const store = resolveStore();
      await store.set(key, value);
    } catch (error) {
      memoryBlobs.set(key, value);
    }
  },
  async getText(key) {
    try {
      const store = resolveStore();
      const result = await store.get(key);
      if (typeof result === "string") {
        return result;
      }
      if (result === null || result === undefined) {
        return null;
      }
      return String(result);
    } catch (error) {
      return memoryBlobs.get(key) ?? null;
    }
  },
};

export const blobKeys = {
  currentFile: (projectId: string, fileId: string) =>
    `projects/${projectId}/files/${fileId}/current.svg`,
  revision: (projectId: string, fileId: string, revisionId: string) =>
    `projects/${projectId}/files/${fileId}/revisions/${revisionId}.svg`,
  exportResult: (projectId: string, fileId: string, jobId: string, ext: string) =>
    `projects/${projectId}/files/${fileId}/exports/${jobId}.${ext}`,
};
