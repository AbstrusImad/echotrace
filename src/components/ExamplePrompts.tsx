import { motion } from "framer-motion";

// Real, submittable example trends (not mock data): selecting one fills the
// input, and the analysis still runs fully on chain.
const examples = [
  "A meme coin trending with identical launch posts across many new accounts in minutes",
  "A grassroots cleanup movement spreading naturally across separate local communities",
  "A hashtag going viral with the same phrasing reposted in synchronized bursts",
  "A product launch getting sudden coordinated praise from freshly created profiles",
];

type ExamplePromptsProps = {
  onSelect: (prompt: string) => void;
};

export function ExamplePrompts({ onSelect }: ExamplePromptsProps) {
  return (
    <div className="example-prompts" aria-label="Example trends">
      <span className="example-label">Try</span>
      {examples.map((example, index) => (
        <motion.button
          key={example}
          type="button"
          className="example-chip"
          onClick={() => onSelect(example)}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.36 + index * 0.06 }}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
        >
          {example.length > 46 ? `${example.slice(0, 46)}...` : example}
        </motion.button>
      ))}
    </div>
  );
}
