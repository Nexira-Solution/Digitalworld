export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import fs from 'fs';
import path from 'path';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getAdminFromRequest } from '@/lib/auth';
import { dbConnect } from '@/lib/mongodb';
import Admin from '@/models/Admin';
import SellerDocument from '@/models/SellerDocument';

const MAX_DOC_SIZE = 10 * 1024 * 1024; // 10 MB

function sniffDocType(buf) {
  if (buf.length >= 4 && buf.subarray(0, 4).toString('ascii') === '%PDF') {
    return { contentType: 'application/pdf', ext: 'pdf' };
  }
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return { contentType: 'image/jpeg', ext: 'jpg' };
  }
  if (
    buf.length >= 8 &&
    buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return { contentType: 'image/png', ext: 'png' };
  }
  if (
    buf.length >= 12 &&
    buf.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buf.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return { contentType: 'image/webp', ext: 'webp' };
  }
  return null;
}

export async function POST(req) {
  try {
    const tokenAdmin = getAdminFromRequest(req);
    if (!tokenAdmin) {
      return NextResponse.json({ error: 'Unauthorized. Please login.' }, { status: 401 });
    }

    await dbConnect();
    const seller = await Admin.findById(tokenAdmin.id);
    if (!seller) {
      return NextResponse.json({ error: 'Seller account not found.' }, { status: 404 });
    }

    const formData = await req.formData();
    const file = formData.get('file');
    const documentType = String(formData.get('documentType') || 'other').trim();
    const customName = String(formData.get('documentName') || '').trim();

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'Please choose a document file to upload.' }, { status: 400 });
    }
    if (file.size > MAX_DOC_SIZE) {
      return NextResponse.json({ error: 'Document file size must be under 10 MB.' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const detected = sniffDocType(buffer);

    if (!detected) {
      return NextResponse.json(
        { error: 'Invalid file format. Only PDF, JPG, PNG, and WebP files are allowed.' },
        { status: 400 }
      );
    }

    const uniqueId = randomUUID();
    const key = `seller-documents/${seller._id}/${uniqueId}.${detected.ext}`;
    let fileUrl = '';

    // 1. Try Cloudflare R2 if credentials present
    const hasR2 =
      process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET_NAME;

    if (hasR2) {
      try {
        const r2 = new S3Client({
          region: 'auto',
          endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
          credentials: {
            accessKeyId: process.env.R2_ACCESS_KEY_ID,
            secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
          },
        });
        await r2.send(
          new PutObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: key,
            Body: buffer,
            ContentType: detected.contentType,
          })
        );
        const base = (process.env.R2_PUBLIC_URL || '').replace(/\/+$/, '');
        fileUrl = `${base}/${key}`;
      } catch (r2Err) {
        console.warn('R2 upload failed, falling back to local persistent storage:', r2Err.message);
      }
    }

    // 2. Fallback to local persistent storage under public/uploads/seller-documents/
    if (!fileUrl) {
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'seller-documents', String(seller._id));
      fs.mkdirSync(uploadDir, { recursive: true });
      const localFilePath = path.join(uploadDir, `${uniqueId}.${detected.ext}`);
      fs.writeFileSync(localFilePath, buffer);
      fileUrl = `/uploads/seller-documents/${seller._id}/${uniqueId}.${detected.ext}`;
    }

    // 3. Format document title
    const typeLabels = {
      gst_certificate: 'GST Registration Certificate',
      pan_card: 'Business PAN Card',
      shop_license: 'Shop & Establishment License',
      business_registration: 'Business Registration Document',
      bank_proof: 'Bank Proof (Cancelled Cheque / Statement)',
      address_proof: 'Address Proof',
      fssai_license: 'FSSAI Food License',
      other: 'Verification Document',
    };
    const documentName = customName || typeLabels[documentType] || file.name || 'Document';

    // 4. Save metadata in MongoDB
    // Check if a document of this type already exists for this seller; if so, replace/update it
    let docRecord = await SellerDocument.findOne({ seller: seller._id, documentType });
    if (docRecord) {
      docRecord.fileName = file.name;
      docRecord.fileUrl = fileUrl;
      docRecord.fileSize = file.size;
      docRecord.mimeType = detected.contentType;
      docRecord.documentName = documentName;
      docRecord.verificationStatus = 'pending';
      docRecord.remarks = '';
      await docRecord.save();
    } else {
      docRecord = await SellerDocument.create({
        seller: seller._id,
        documentType,
        documentName,
        fileName: file.name,
        fileUrl,
        fileSize: file.size,
        mimeType: detected.contentType,
        verificationStatus: 'pending',
      });
    }

    return NextResponse.json({
      ok: true,
      message: `${documentName} uploaded successfully. Status: Pending Verification.`,
      document: docRecord,
    });
  } catch (err) {
    console.error('Document upload error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to upload document.' },
      { status: 500 }
    );
  }
}

