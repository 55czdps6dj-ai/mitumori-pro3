import { NextResponse } from 'next/server';
import {
  buildEstimateWorkbookBuffer,
  buildEstimateWorkbookFileName,
} from '../../../features/estimate/server/buildEstimateWorkbook';

export const runtime = 'nodejs';

const GRAPH_SCOPE = 'https://graph.microsoft.com/.default';
const GRAPH_BASE_URL = 'https://graph.microsoft.com/v1.0';

const getMicrosoftAccessToken = async () => {
  const tenantId = process.env.MICROSOFT_TENANT_ID;
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;

  if (!tenantId || !clientId || !clientSecret) {
    throw new Error('Microsoft 365連携の環境変数が未設定です。');
  }

  const response = await fetch(
    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        scope: GRAPH_SCOPE,
        grant_type: 'client_credentials',
      }),
    }
  );

  const result = await response.json();
  if (!response.ok) {
    throw new Error(
      result?.error_description || 'Microsoft認証に失敗しました。'
    );
  }

  return result.access_token as string;
};

const encodeOneDrivePath = (filePath: string) =>
  filePath
    .split('/')
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join('/');

const buildUploadUrl = (fileName: string) => {
  const userId = process.env.MICROSOFT_ONEDRIVE_USER_ID;
  if (!userId) {
    throw new Error('MICROSOFT_ONEDRIVE_USER_ID が未設定です。');
  }

  const folder = process.env.MICROSOFT_ONEDRIVE_OUTPUT_FOLDER || '見積書';
  const uploadPath = encodeOneDrivePath(`${folder}/${fileName}`);

  return `${GRAPH_BASE_URL}/users/${encodeURIComponent(
    userId
  )}/drive/root:/${uploadPath}:/content`;
};

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const fileName = buildEstimateWorkbookFileName(payload?.customer?.name);
    const buffer = await buildEstimateWorkbookBuffer(payload);
    const accessToken = await getMicrosoftAccessToken();

    const uploadResponse = await fetch(buildUploadUrl(fileName), {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
      body: buffer,
    });

    const result = await uploadResponse.json();
    if (!uploadResponse.ok) {
      throw new Error(
        result?.error?.message || 'OneDriveへの保存に失敗しました。'
      );
    }

    return NextResponse.json({
      fileName,
      webUrl: result.webUrl,
      itemId: result.id,
    });
  } catch (error: any) {
    console.error('Estimate OneDrive export failed:', error);
    return NextResponse.json(
      {
        message: error?.message || 'OneDrive見積書の作成に失敗しました。',
      },
      { status: 500 }
    );
  }
}
