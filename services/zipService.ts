
import JSZip from 'jszip';
import { ZipFileEntry } from '../types';

export const parseZipFile = async (file: File): Promise<ZipFileEntry[]> => {
  const zip = new JSZip();
  const content = await zip.loadAsync(file);
  const entries: ZipFileEntry[] = [];
  const promises: Promise<void>[] = [];

  // Use zip.forEach to iterate over entries. This ensures zipEntry is correctly typed as JSZipObject,
  // fixing the 'unknown' type errors encountered with Object.entries.
  content.forEach((path, zipEntry) => {
    const promise = (async () => {
      if (!zipEntry.dir) {
        // Read file content as string
        const text = await zipEntry.async('string');
        entries.push({
          name: zipEntry.name.split('/').pop() || '',
          path: zipEntry.name,
          content: text,
          isFolder: false,
          // size is stored in the internal _data property for uncompressed size
          size: (zipEntry as any)._data?.uncompressedSize || 0
        });
      } else {
        entries.push({
          name: zipEntry.name.split('/').filter(Boolean).pop() || '',
          path: zipEntry.name,
          content: '',
          isFolder: true,
          size: 0
        });
      }
    })();
    promises.push(promise);
  });

  // Ensure all asynchronous content reads are finished before returning
  await Promise.all(promises);

  return entries.sort((a, b) => {
    if (a.isFolder && !b.isFolder) return -1;
    if (!a.isFolder && b.isFolder) return 1;
    return a.path.localeCompare(b.path);
  });
};
