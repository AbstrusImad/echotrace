import { motion } from "framer-motion";

const examples = [
  "#NewAIProtocol",
  "Is this hype organic?",
  "Analyze this trend",
  "Check narrative spread",
];

type ExamplePromptsProps = {
  onSelect: (prompt: string) => void;
};

export function ExamplePrompts({ onSelect }: ExamplePromptsProps) {
  return (
    <div className="example-prompts" aria-label="Example prompts">
      {examples.map((example, index) => (
        <motion.button
          key={example}
          type="button"
          className="example-chip"
          onClick={() => onSelect(example)}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 + index * 0.06 }}
          whileHover={{ y: -3, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {example}
        </motion.button>
      ))}
    </div>
  );
}
