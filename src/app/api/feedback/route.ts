import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
  const { topic, message } = await req.json();

  if (!message?.trim()) {
    return NextResponse.json({ error: "Mensaje vacío" }, { status: 400 });
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  await transporter.sendMail({
    from: `"Ronda Feedback" <${process.env.GMAIL_USER}>`,
    to: "ordenalaronda@gmail.com",
    subject: topic ? `Feedback: ${topic}` : "Feedback de Ronda",
    text: message,
    html: `
      <div style="font-family:sans-serif;max-width:560px">
        ${topic ? `<p style="color:#888;font-size:13px;margin-bottom:8px">Categoría: <strong>${topic}</strong></p>` : ""}
        <p style="font-size:16px;white-space:pre-wrap">${message}</p>
      </div>
    `,
  });

  return NextResponse.json({ ok: true });
}
