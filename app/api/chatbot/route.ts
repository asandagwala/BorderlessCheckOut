import { NextResponse } from 'next/server';
import { ChatbotService } from '@/modules/ai-chatbot/chatbot.service';
import { chatMessageInputSchema } from '@/lib/validations';

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const result = chatMessageInputSchema.safeParse(json);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message, details: result.error.issues },
        { status: 400 }
      );
    }

    const { merchantId, message, history } = result.data;

    const chatResponse = await ChatbotService.handleChatMessage(
      merchantId,
      message,
      history
    );

    return NextResponse.json(chatResponse);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
