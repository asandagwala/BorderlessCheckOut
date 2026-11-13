import { NextResponse } from 'next/server';
import { ChatbotService } from '@/modules/ai-chatbot/chatbot.service';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { merchantId, message, history } = body;

    if (!merchantId || !message) {
      return NextResponse.json(
        { error: 'merchantId and message are required.' },
        { status: 400 }
      );
    }

    const result = await ChatbotService.handleChatMessage(
      merchantId,
      message,
      history || []
    );

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
