import { NextResponse } from 'next/server';
import {
  buildEstimateWorkbookBuffer,
  buildEstimateWorkbookFileName,
} from '../../../features/estimate/server/buildEstimateWorkbook';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const fileName = buildEstimateWorkbookFileName(payload?.customer?.name);
    const buffer = await buildEstimateWorkbookBuffer(payload);

    return new NextResponse(buffer, {
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(
          fileName
        )}`,
      },
    });
  } catch (error: any) {
    console.error('Estimate workbook download failed:', error);
    return NextResponse.json(
      {
        message: error?.message || 'Excel見積書の作成に失敗しました。',
      },
      { status: 500 }
    );
  }
}
