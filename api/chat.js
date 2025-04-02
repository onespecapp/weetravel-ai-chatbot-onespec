import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end('Method not allowed');
  }

  const { message, threadId } = req.body;
  const assistantId = process.env.ASSISTANT_ID;

  const thread = threadId 
    ? await openai.beta.threads.retrieve(threadId)
    : await openai.beta.threads.create();

  await openai.beta.threads.messages.create(thread.id, {
    role: 'user',
    content: message,
  });

  const run = await openai.beta.threads.runs.create(thread.id, {
    assistant_id: assistantId,
  });

  let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
  while (runStatus.status !== 'completed') {
    await new Promise(r => setTimeout(r, 1000));
    runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
  }

  const messages = await openai.beta.threads.messages.list(thread.id);
  const lastMessage = messages.data[0].content[0].text.value;

  res.json({ message: lastMessage, threadId: thread.id });
}
