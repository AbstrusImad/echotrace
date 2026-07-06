import { motion } from "framer-motion";

const particles = Array.from({ length: 34 }, (_, index) => ({
  id: index,
  left: `${(index * 37) % 100}%`,
  top: `${(index * 53) % 100}%`,
  delay: (index % 9) * 0.35,
  size: 2 + (index % 4),
}));

export function SignalParticles() {
  return (
    <div className="signal-particles" aria-hidden="true">
      {particles.map((particle) => (
        <motion.span
          key={particle.id}
          className="signal-particle"
          style={{
            left: particle.left,
            top: particle.top,
            width: particle.size,
            height: particle.size,
          }}
          animate={{
            opacity: [0.15, 0.65, 0.15],
            y: [-8, 12, -8],
            scale: [1, 1.8, 1],
          }}
          transition={{
            duration: 5.6,
            delay: particle.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
