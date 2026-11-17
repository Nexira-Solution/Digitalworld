export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import { getPrefixForCategory, peekNextProductId } from '@/lib/productId';

export async function GET(req) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get('categoryId');
    const subcategoryId = searchParams.get('subcategoryId');

    const prefix = await getPrefixForCategory(categoryId, subcategoryId);
    const previewId = await peekNextProductId(prefix);

    return NextResponse.json({
      prefix,
      previewId,
    });
  } catch (err) {
    console.error('GET /api/products/next-id error:', err);
    return NextResponse.json(
      { prefix: 'PRD', previewId: 'PRD-00001', error: err.message },
      { status: 500 }
    );
  }
}
