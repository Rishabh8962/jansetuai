import { motion, AnimatePresence } from 'framer-motion';

type AvatarState = 'idle' | 'listening' | 'thinking' | 'speaking';
type Mood = 'neutral' | 'happy' | 'serious' | 'excited';

interface Props {
  state: AvatarState;
  mood?: Mood;
  size?: number;
  /** 0-1 mouth openness driven by audio level or speech ticks */
  mouth?: number;
}

const MOOD_BG: Record<Mood, string> = {
  neutral: 'from-indigo-500 via-violet-500 to-teal-400',
  happy: 'from-emerald-400 via-teal-400 to-indigo-400',
  serious: 'from-rose-500 via-orange-500 to-amber-400',
  excited: 'from-fuchsia-500 via-indigo-500 to-cyan-400',
};

export function JanMitraAvatar({ state, mood = 'neutral', size = 120, mouth = 0 }: Props) {
  const isSpeaking = state === 'speaking';
  const isListening = state === 'listening';
  const isThinking = state === 'thinking';

  // Eye shape changes by mood
  const eyeArc = mood === 'happy' ? 'M -3 0 Q 0 -4 3 0' : mood === 'serious' ? 'M -4 1 L 4 -1' : 'M -3 0 Q 0 -3 3 0';

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      {/* Glow rings */}
      <motion.div
        className={`absolute inset-0 rounded-full bg-gradient-to-br ${MOOD_BG[mood]} opacity-30 blur-2xl`}
        animate={{ scale: isSpeaking ? [1, 1.15, 1] : isListening ? [1, 1.08, 1] : [1, 1.04, 1] }}
        transition={{ duration: isSpeaking ? 0.6 : 2.5, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Listening pulse rings */}
      <AnimatePresence>
        {isListening && (
          <>
            {[0, 0.4, 0.8].map((d) => (
              <motion.div
                key={d}
                className="absolute rounded-full border-2 border-teal-300/50"
                style={{ width: size, height: size }}
                initial={{ scale: 0.9, opacity: 0.7 }}
                animate={{ scale: 1.6, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.6, repeat: Infinity, delay: d, ease: 'easeOut' }}
              />
            ))}
          </>
        )}
      </AnimatePresence>

      {/* Avatar core */}
      <motion.div
        className={`relative rounded-full bg-gradient-to-br ${MOOD_BG[mood]} shadow-2xl shadow-indigo-500/40 overflow-hidden`}
        style={{ width: size * 0.78, height: size * 0.78 }}
        animate={{
          scale: isThinking ? [1, 0.97, 1] : 1,
          rotate: isThinking ? [0, -2, 2, 0] : 0,
        }}
        transition={{ duration: 1.2, repeat: isThinking ? Infinity : 0 }}
      >
        {/* Inner glass */}
        <div className="absolute inset-0 backdrop-blur-sm bg-white/5" />
        <div className="absolute inset-2 rounded-full bg-gradient-to-b from-white/30 to-transparent" />

        {/* Face SVG */}
        <svg viewBox="-30 -30 60 60" className="relative w-full h-full">
          {/* Eyes */}
          <g fill="white" stroke="white" strokeWidth="2.2" strokeLinecap="round" fill="none">
            <motion.path
              d={eyeArc}
              transform="translate(-9 -4)"
              animate={isThinking ? { opacity: [1, 0.3, 1] } : { opacity: 1 }}
              transition={{ duration: 0.8, repeat: isThinking ? Infinity : 0 }}
            />
            <motion.path
              d={eyeArc}
              transform="translate(9 -4)"
              animate={isThinking ? { opacity: [1, 0.3, 1] } : { opacity: 1 }}
              transition={{ duration: 0.8, repeat: isThinking ? Infinity : 0, delay: 0.15 }}
            />
          </g>

          {/* Blink overlay (idle) */}
          {state === 'idle' && (
            <motion.g
              animate={{ scaleY: [1, 0.05, 1] }}
              transition={{ duration: 0.18, repeat: Infinity, repeatDelay: 3.4, ease: 'easeInOut' }}
              style={{ transformOrigin: '0 -4px' }}
            >
              <rect x="-13" y="-6" width="8" height="0.5" fill="transparent" />
              <rect x="5" y="-6" width="8" height="0.5" fill="transparent" />
            </motion.g>
          )}

          {/* Mouth — animated by mouth prop when speaking */}
          {isSpeaking ? (
            <motion.ellipse
              cx="0"
              cy="9"
              rx={4 + mouth * 2}
              ry={1 + mouth * 4}
              fill="rgba(0,0,0,0.55)"
            />
          ) : mood === 'happy' ? (
            <path d="M -7 7 Q 0 13 7 7" stroke="white" strokeWidth="2.2" fill="none" strokeLinecap="round" />
          ) : mood === 'serious' ? (
            <path d="M -6 10 L 6 10" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
          ) : (
            <path d="M -5 9 Q 0 11 5 9" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" />
          )}
        </svg>

        {/* Idle breathing shimmer */}
        <motion.div
          className="absolute inset-0 rounded-full"
          animate={{ opacity: [0.0, 0.15, 0.0] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
          style={{ background: 'radial-gradient(circle at 30% 20%, white, transparent 60%)' }}
        />
      </motion.div>

      {/* Thinking dots */}
      {isThinking && (
        <div className="absolute -bottom-1 flex gap-1">
          {[0, 0.15, 0.3].map((d) => (
            <motion.span
              key={d}
              className="w-1.5 h-1.5 rounded-full bg-indigo-400"
              animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 0.9, repeat: Infinity, delay: d }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default JanMitraAvatar;
