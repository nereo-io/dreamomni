import ChatInterface from '@/components/readers/ChatInterface'
import { getAiReaderInfo } from '@/services/readers/aiReaderInfo'

export default async function CustomerReading({ 
  params 
}: { 
  params: Promise<{ id: string; customerId: string }> 
}) {
  const { id: readerId, customerId } = await params;
  
  const aiReader = await getAiReaderInfo(readerId);

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-b from-[#f8f9fa] to-white">
      <ChatInterface 
        aiReader={aiReader}
        customerId={customerId}
      />
    </div>
  );
}
