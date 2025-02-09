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
    <div className="relative w-[300px] flex flex-col items-center">
        {/* 太极图 */}
        <motion.div 
          className="w-16 h-16 mb-12"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        >
          <img 
            src="/imgs/chat/taiji.svg" 
            alt="太极图" 
            className="w-full h-full"
          />
        </motion.div>

        {/* 文字提示 */}
        <div className="absolute bottom-0 left-0 right-0">
          <motion.div
            key={currentPhrase}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="text-center"
          >
            <p className="text-sm text-muted-foreground px-4">{phrases[currentPhrase]}</p>
            <div className="mt-3 flex justify-center space-x-1.5">
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  className="w-1 h-1 rounded-full bg-primary/40"
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.4, 0.8, 0.4],
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
        </div>
    </div>
  );
};
export default LoadingAnimation;
