import { NextRequest, NextResponse } from 'next/server';
import { loginWithPin, createStaffSession } from '@qrserveup/auth';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  tenantId: z.string().uuid(),
  staffId: z.string().uuid(),
  pin: z.string().min(4).max(6),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: 'بيانات غير صالحة' }, { status: 400 });
    }

    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const ua = req.headers.get('user-agent') || null;

    const result = await loginWithPin({ ...parsed.data, ipAddress: ip, userAgent: ua });

    if (!result.success) {
      const status = result.code === 'LOCKED' || result.code === 'LOCKED_NOW' ? 429 : 401;
      return NextResponse.json({ error: result.error, code: result.code }, { status });
    }

    const session = await createStaffSession({
      tenantId: parsed.data.tenantId,
      staffId: parsed.data.staffId,
      ipAddress: ip,
      userAgent: ua,
    });

    const response = NextResponse.json({ success: true, staff: { id: result.staff.id, name: result.staff.name } });
    response.cookies.set('staff_session_id', session.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 12 * 60 * 60,
    });
    return response;
  } catch (error) {
    console.error('PIN login error:', error);
    return NextResponse.json({ error: 'حدث خطأ داخلي' }, { status: 500 });
  }
}
