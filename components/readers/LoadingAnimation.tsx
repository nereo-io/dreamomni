import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import type { ChatPage } from "@/types/pages/chat";

interface LoadingAnimationProps {
  messages: ChatPage;
}

const LoadingAnimation = ({ messages }: LoadingAnimationProps) => {
  const [currentPhrase, setCurrentPhrase] = useState(0);
  
  const { loadingAnimation } = messages;
  const { phrases, pillars } = loadingAnimation;
  
  const pillarItems = [
    { key: 'year', ...pillars.year },
    { key: 'month', ...pillars.month },
    { key: 'day', ...pillars.day },
    { key: 'hour', ...pillars.hour },
  ];
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentPhrase((prev) => (prev + 1) % phrases.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [phrases.length]);

  return (
    <div className="relative w-[300px] h-[400px] bg-card rounded-lg shadow-lg overflow-hidden">
      {/* 古籍背景 */}
      <div className="absolute inset-0 bg-[url('/imgs/chat/ancient-book.png')] bg-cover bg-center opacity-30" />
      
      <div className="relative flex flex-col items-center justify-between h-full py-8 px-4">
        {/* 太极图 */}
        <motion.div 
          className="w-20 h-20"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        >
          <img 
            src="/imgs/chat/taiji.svg" 
            alt="太极图" 
            className="w-full h-full filter drop-shadow-md"
          />
        </motion.div>

        {/* 四柱排盘 */}
        <div className="w-full grid grid-cols-4 gap-2 mt-4">
          {pillarItems.map((pillar, i) => (
            <motion.div
              key={pillar.name}
              className="bg-black/5 backdrop-blur rounded p-2 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.2 }}
            >
              <div className="text-xs font-medium mb-1">{pillar.name}</div>
              <div className="text-[10px] text-muted-foreground mb-3">{pillar.desc}</div>
              <motion.div
                className="h-11 border border-primary/20 rounded"
                animate={{
                  borderColor: ['hsl(var(--primary))', 'hsl(var(--primary-foreground))'],
                  boxShadow: ['0 0 0px hsl(var(--primary))', '0 0 8px hsl(var(--primary))'],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.div>
          ))}
        </div>

        {/* 文字提示 */}
        <div className="text-center space-y-2">
          <motion.div
            key={currentPhrase}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <p className="text-sm text-muted-foreground font-serif">{phrases[currentPhrase]}</p>
            <div className="mt-4 flex justify-center space-x-2">
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-primary/60"
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                />
              ))}
            </div>
          </motion.div>

          {/* 等待时间提示 */}
          <motion.div
            className="text-xs text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {loadingAnimation.waitTime}
          </motion.div>
        </div>
      </div>
    </div>
  );
};
export default LoadingAnimation;
