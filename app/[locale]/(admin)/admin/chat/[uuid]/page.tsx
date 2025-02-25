import { getChatMessagesByChatSessionId } from "@/models/chat";
import Empty from "@/components/blocks/empty";
import { getUserInfo } from "@/services/user";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

export default async function ({ params }: { params: { uuid: string } }) {
  const user = await getUserInfo();
  if (!user || !user.uuid) {
    return <Empty message="no auth" />;
  }

  const chatMessages = await getChatMessagesByChatSessionId(params.uuid);
  if (!chatMessages) {
    return <Empty message="chat session not found" />;
  }

  return (
    <div className="flex-1 overflow-y-auto min-h-0 bg-background">
      <div className="max-w-6xl mx-auto space-y-2 sm:space-y-4 px-2 py-2 sm:px-4 sm:py-4">
        {chatMessages.data?.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={cn(
                "max-w-[92%] rounded-lg p-4",
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-card-foreground backdrop-blur-sm"
              )}
            >
              {true && message.reasoning_content && (
                <blockquote className="mb-4 border-l-4 border-gray-300 dark:border-gray-700 pl-4 text-sm text-gray-500 dark:text-gray-400">
                  {message.reasoning_content.trim()}
                </blockquote>
              )}
              <Markdown
                remarkPlugins={[remarkGfm]}
                components={{
                  a: ({ node, ...props }) => (
                    <a className="text-blue-500 hover:underline" {...props} />
                  ),
                  p: ({ children }) => (
                    <p className="m-0 leading-relaxed">{children}</p>
                  ),
                  h1: ({ children }) => (
                    <h1 className="text-xl font-bold my-2">{children}</h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-lg font-semibold my-2">{children}</h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-lg font-semibold my-2">{children}</h3>
                  ),
                  h4: ({ children }) => (
                    <h4 className="text-base font-semibold my-2">{children}</h4>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc list-inside my-2">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal list-inside my-2">
                      {children}
                    </ol>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-gray-300 pl-4 my-2 italic">
                      {children}
                    </blockquote>
                  ),
                  hr: () => <hr className="hidden" />,
                  table: ({ children }) => (
                    <table className="min-w-full my-4 border-collapse border border-gray-200">
                      {children}
                    </table>
                  ),
                  thead: ({ children }) => (
                    <thead className="bg-gray-50">{children}</thead>
                  ),
                  tbody: ({ children }) => (
                    <tbody className="bg-white divide-y divide-gray-200">
                      {children}
                    </tbody>
                  ),
                  tr: ({ children }) => (
                    <tr className="hover:bg-gray-50">{children}</tr>
                  ),
                  th: ({ children }) => (
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600 border border-gray-200">
                      {children}
                    </th>
                  ),
                  td: ({ children }) => (
                    <td className="px-4 py-2 text-sm text-gray-500 border border-gray-200">
                      {children}
                    </td>
                  ),
                  // 不显示图片
                  img: () => null,
                }}
              >
                {message.content.trim()}
              </Markdown>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
