import { TrackerData } from '../types/tracker';
import {
  DRIVE_FILE_ID_KEY,
  mergeTrackerData,
} from '../utils/trackerData';

const DRIVE_FILE_NAME = 'expense_tracker.json';

export class DriveSyncError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'DriveSyncError';
    this.status = status;
  }
}

async function driveFetch(url: string, accessToken: string, options: RequestInit = {}): Promise<Response> {
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const raw = await res.text();
    let msg = `Google Drive API error (${res.status})`;
    try {
      const parsed = JSON.parse(raw);
      if (parsed?.error?.message) msg = parsed.error.message;
    } catch {
      // ignore non-JSON body
    }
    throw new DriveSyncError(msg, res.status);
  }
  return res;
}

export async function findDriveFileId(accessToken: string): Promise<string> {
  const q = encodeURIComponent(`name='${DRIVE_FILE_NAME}' and trashed=false`);
  const url = `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=${q}&fields=files(id,name,modifiedTime)&orderBy=modifiedTime%20desc`;
  const res = await driveFetch(url, accessToken);
  const data = (await res.json()) as { files?: Array<{ id: string }> };
  return data.files && data.files.length > 0 ? data.files[0].id : '';
}

async function downloadDriveFile(fileId: string, accessToken: string): Promise<Partial<TrackerData>> {
  const res = await driveFetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`,
    accessToken
  );
  return (await res.json()) as Partial<TrackerData>;
}

async function createDriveFile(payload: TrackerData, accessToken: string): Promise<string> {
  const boundary = 'cozyledger_' + Math.random().toString(36).slice(2);
  const metadata = JSON.stringify({
    name: DRIVE_FILE_NAME,
    parents: ['appDataFolder'],
    mimeType: 'application/json',
  });
  const body =
    `--${boundary}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${metadata}\r\n` +
    `--${boundary}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${JSON.stringify(payload)}\r\n` +
    `--${boundary}--`;

  const res = await driveFetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
    accessToken,
    {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body,
    }
  );
  const created = (await res.json()) as { id: string };
  return created.id;
}

async function updateDriveFile(fileId: string, payload: TrackerData, accessToken: string): Promise<void> {
  await driveFetch(
    `https://www.googleapis.com/upload/drive/v3/files/${encodeURIComponent(fileId)}?uploadType=media`,
    accessToken,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
      },
      body: JSON.stringify(payload),
    }
  );
}

export async function syncWithGoogleDrive(
  localData: TrackerData,
  accessToken: string,
  userEmail?: string
): Promise<{ mergedData: TrackerData; fileId: string; hadRemote: boolean }> {
  const storageKey = userEmail ? `${DRIVE_FILE_ID_KEY}_${userEmail}` : DRIVE_FILE_ID_KEY;
  let fileId = localStorage.getItem(storageKey) || '';
  if (!fileId) {
    fileId = await findDriveFileId(accessToken);
  }

  let mergedData = localData;
  let hadRemote = false;

  if (fileId) {
    let remoteData: Partial<TrackerData> | null = null;
    try {
      remoteData = await downloadDriveFile(fileId, accessToken);
    } catch (err) {
      if (err instanceof DriveSyncError && err.status === 404) {
        fileId = await findDriveFileId(accessToken);
        if (fileId) {
          remoteData = await downloadDriveFile(fileId, accessToken);
        }
      } else {
        throw err;
      }
    }

    if (remoteData) {
      hadRemote = true;
      mergedData = mergeTrackerData(localData, remoteData);
    }

    if (fileId) {
      await updateDriveFile(fileId, mergedData, accessToken);
    } else {
      fileId = await createDriveFile(mergedData, accessToken);
    }
  } else {
    fileId = await createDriveFile(mergedData, accessToken);
  }

  localStorage.setItem(storageKey, fileId);
  return { mergedData, fileId, hadRemote };
}
