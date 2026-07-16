import OpenAI from "openai";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const client = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY,
  baseURL: "https://integrate.api.nvidia.com/v1",
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }
  const userId = session.user.id;

  const { messages, conversationId } = await req.json();
  const lastMessage = messages[messages.length - 1];

  const existing = conversationId
    ? await prisma.conversation.findFirst({
        where: { id: conversationId, userId },
      })
    : null;

  const conversationRecord =
    existing ??
    (await prisma.conversation.create({
      data: {
        userId,
        title: lastMessage.content.slice(0, 40),
      },
    }));

  await prisma.message.create({
    data: {
      conversationId: conversationRecord.id,
      role: lastMessage.role,
      content: lastMessage.content,
    },
  });

  const completion = await client.chat.completions.create({
    model: "qwen/qwen3-next-80b-a3b-instruct",
    messages,
    stream: true,
  });

  let fullContent = "";
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      for await (const chunk of completion) {
        const token = chunk.choices[0]?.delta?.content ?? "";
        if (token) {
          fullContent += token;
          controller.enqueue(encoder.encode(token));
        }
      }
      await prisma.message.create({
        data: {
          conversationId: conversationRecord.id,
          role: "assistant",
          content: fullContent,
        },
      });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { "X-Conversation-Id": conversationRecord.id },
  });
}
