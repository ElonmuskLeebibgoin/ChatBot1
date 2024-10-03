import { NextResponse } from 'next/server';

const API_KEY = process.env.DEEPSEEK_API_KEY || 'sk-5554cd9870954bbbb640e2cf401ccf96';
const API_URL = 'https://api.deepseek.com/v1/chat/completions';

export async function POST(request: Request) {
  try {
    const { messages } = await request.json();
    
    console.log('Received messages:', messages);
    console.log('API_KEY:', API_KEY ? 'Set' : 'Not set');

    if (!API_KEY) {
      throw new Error('DEEPSEEK_API_KEY is not set');
    }

    const systemMessage = {
      role: "system",
      content: `你是"小鱼炳AI"，这个AI聊天网站的助手。你的回答应该：
      1. 保持专业和信息丰富。
      2. 使用清晰、简洁的语言。
      3. 保持友好和有帮助的态度。
      4. 根据问题的复杂程度，提供适当详细的回答。
      5. 在需要时提供具体的例子或解释。
      6. 如果不确定或没有相关信息，诚实地表示。
      7. 回答时要分段落，每个段落不要太长。
      你的目标是提供准确、有用的信息，并以专业的方式协助用户。`
    };

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [systemMessage, ...messages],
        temperature: 0.3,
        max_tokens: 2000,
        stream: true // 启用流式响应
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Deepseek API error:', errorText);
      throw new Error(`Deepseek API request failed with status ${response.status}: ${errorText}`);
    }

    // 创建一个 ReadableStream
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = new TextDecoder().decode(value);
          const lines = chunk.split('\n').filter(line => line.trim() !== '');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                controller.close();
                return;
              }
              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices[0].delta.content;
                if (content) {
                  controller.enqueue(content);
                }
              } catch (e) {
                console.error('Error parsing JSON:', e);
              }
            }
          }
        }
        controller.close();
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain',
        'Transfer-Encoding': 'chunked'
      }
    });
  } catch (error: any) {
    console.error('Error in API route:', error);
    return NextResponse.json({ error: error.message || 'An error occurred while processing your request' }, { status: 500 });
  }
}