'use client';

import React, { useState, useEffect } from 'react';
import { useChat } from 'ai/react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';

interface AiReader {
  name: string;
  avatar: string;
  description: string;
}

interface ChatInterfaceProps {
  aiReader: AiReader;
  customerId: string;
}

export default function ChatInterface({ aiReader, customerId }: ChatInterfaceProps) {
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages } = useChat({
    api: '/api/chat',
    body: {
      customerId,
    },
    onFinish: (message) => {
      // 添加日志：查看完整消息
      console.log('Chat Finished. Message:', {
        role: message.role,
        content: message.content,
        rawContent: JSON.stringify(message.content)  // 显示原始字符串，包括换行符
      });
    },
    onError: (error) => {
      setError(error.message);
      console.error('Chat error:', error);
    },
  });

  // 处理初始化消息
  useEffect(() => {
    const initializeChat = async () => {
      if (messages.length === 0) {
        try {
          setIsInitializing(true);
          const response = await fetch('/api/chat/initialize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ customerId }),
          });

          if (!response.ok) throw new Error('初始化消息失败');

          const reader = response.body?.getReader();
          const decoder = new TextDecoder();
          let content = '';

          while (reader) {
            const { done, value } = await reader.read();
            if (done) break;
            content += decoder.decode(value);
          }

          setMessages([
            { id: Date.now().toString(), role: 'assistant', content }
          ]);
        } catch (err) {
          console.error('初始化聊天失败:', err);
          setError('初始化聊天失败，请刷新页面重试');
        } finally {
          setIsInitializing(false);
        }
      }
    };

    initializeChat();
  }, []);

  return (
    <div className="relative h-full flex flex-col">
      {/* 顶部 AI Reader 信息层 */}
      <div className="sticky top-0 z-10 bg-gradient-to-b from-white/80 to-transparent pb-4">
        <div className="container max-w-6xl mx-auto px-4 pt-4">
          <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-sm border border-gray-100 p-3 md:p-4">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-full overflow-hidden border-2 border-[#e9d5a1] flex-shrink-0">
                <img 
                  src={aiReader.avatar} 
                  alt={aiReader.name}
                  className="w-full h-full object-cover"
                  style={{ aspectRatio: '1/1' }}
                />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg md:text-xl font-medium text-gray-900 truncate">{aiReader.name}</h1>
                <p className="text-xs md:text-sm text-gray-500 line-clamp-2">{aiReader.description}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 聊天内容区域 */}
      <div className="flex-1 overflow-y-auto px-4">
        <div className="max-w-6xl mx-auto space-y-4 py-4">
          {/* 首次加载动画 */}
          {messages.length === 0 && isInitializing ? (
            <div className="flex flex-col items-center justify-center p-8 space-y-4">
              {/* 占位头像 */}
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-[#e9d5a1] to-[#f3e4c0] animate-pulse" />
              
              {/* 加载动画 */}
              <div className="flex flex-col items-center space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-[#e9d5a1] rounded-full animate-bounce" />
                  <div className="w-3 h-3 bg-[#e9d5a1] rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-3 h-3 bg-[#e9d5a1] rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
                <p className="text-gray-500 animate-pulse">
                  正在为您生成个性化八字分析...
                </p>
              </div>

              {/* 提示文本 */}
              <div className="text-center text-sm text-gray-400 max-w-sm">
                <p>清风明月正在仔细研究您的八字命盘</p>
                <p>大约需要30秒钟</p>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-4 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-white/80 backdrop-blur-sm'
                  } prose prose-sm max-w-none`}
                >
                  <Markdown 
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw, rehypeSanitize]}
                    components={{
                      // 自定义列表项渲染，解决换行展示的问题
                      li: ({children, ...props}: React.HTMLProps<HTMLLIElement> & {
                        ordered?: boolean;
                        index?: number;
                      }) => {
                        const content = React.Children.map(children, child => {
                          if (typeof child === 'string') {
                            return <span>{child}</span>;
                          }
                          return child;
                        });

                        return (
                          <li className="flex items-start my-2">
                            <span className="flex-shrink-0 min-w-[1.2em]">
                              {props.ordered ? `${(props.index ?? 0) + 1}.` : '•'}
                            </span>
                            <span className="flex-1 -ml-1">{content}</span>
                          </li>
                        );
                      },
                      p: ({children}) => (
                        <p className="m-0 leading-relaxed">{children}</p>
                      ),
                      h1: ({children}) => (
                        <h1 className="text-xl font-bold my-2">{children}</h1>
                      ),
                      h2: ({children}) => (
                        <h2 className="text-lg font-semibold my-2">{children}</h2>
                      ),
                      h3: ({children}) => (
                        <h3 className="text-lg font-semibold my-2">{children}</h3>
                      ),
                      h4: ({children}) => (
                        <h4 className="text-base font-semibold my-2">{children}</h4>
                      ),
                      ul: ({children}) => (
                        <ul className="list-disc list-inside my-2">{children}</ul>
                      ),
                      ol: ({children}) => (
                        <ol className="list-decimal list-inside my-2">{children}</ol>
                      ),
                      blockquote: ({children}) => (
                        <blockquote className="border-l-4 border-gray-300 pl-4 my-2 italic">
                          {children}
                        </blockquote>
                      ),
                      hr: () => (
                        <hr className="hidden" />
                      ),
                      // 表格相关组件
                      table: ({children}) => (
                        <table className="min-w-full my-4 border-collapse border border-gray-200">
                          {children}
                        </table>
                      ),
                      thead: ({children}) => (
                        <thead className="bg-gray-50">
                          {children}
                        </thead>
                      ),
                      tbody: ({children}) => (
                        <tbody className="bg-white divide-y divide-gray-200">
                          {children}
                        </tbody>
                      ),
                      tr: ({children}) => (
                        <tr className="hover:bg-gray-50">
                          {children}
                        </tr>
                      ),
                      th: ({children}) => (
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600 border border-gray-200">
                          {children}
                        </th>
                      ),
                      td: ({children}) => (
                        <td className="px-4 py-2 text-sm text-gray-500 border border-gray-200">
                          {children}
                        </td>
                      ),
                    }}
                  >
                    {message.content.trim()}
                  </Markdown>
                </div>
              </div>
            ))
          )}
          
          {/* 消息加载动画 */}
          {isLoading && messages.length > 0 && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-lg p-4 bg-white/80 backdrop-blur-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 底部输入框和版权信息层 */}
      <div className="sticky bottom-0 z-10 bg-gradient-to-t from-white/80 to-transparent pt-4">
        <div className="container max-w-6xl mx-auto px-4 pb-4 space-y-4">
          <form onSubmit={handleSubmit} className="bg-white/80 backdrop-blur-sm rounded-lg shadow-lg border border-gray-100 p-3">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={handleInputChange}
                placeholder="请输入您想咨询的问题..."
                disabled={isLoading}
                className="bg-white h-12"
              />
              <Button type="submit" disabled={isLoading} className="h-12">
                发送
              </Button>
            </div>
          </form>
          
          <div className="text-center text-xs md:text-sm text-gray-400">
            每次解答都经过专业命理系统分析，仅供参考
          </div>
        </div>
      </div>
    </div>
  );
}