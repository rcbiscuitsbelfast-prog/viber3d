import { motion } from 'framer-motion';

export default function AssetCreditsFooter() {
  const creators = [
    {
      name: 'Kenney',
      logo: '/Assets/kenny logo.png',
      url: 'https://kenney.nl/assets',
    },
    {
      name: 'KayKit',
      logo: '/Assets/kaykit logo.png',
      url: 'https://www.kaylousberg.com/',
    },
    {
      name: 'Quaternius',
      logo: '/Assets/quaternius logo.png',
      url: 'https://quaternius.com/',
    },
    {
      name: 'AlkaKrab',
      logo: '/Assets/alkakrab logo.png',
      url: 'https://alkakrab.itch.io/',
    },
  ];

  return (
    <footer className="w-full mt-auto py-8 px-4 border-t border-primary/20">
      <div className="max-w-4xl mx-auto">
        {/* Text Content */}
        <div className="text-center mb-6">
          <p className="text-sm md:text-base text-muted-foreground mb-2 font-display">
            Made possible by the free asset community
          </p>
          <p className="text-xs md:text-sm text-muted-foreground/80 mb-4 font-display leading-relaxed">
            Questerly is built using free, open asset packs from incredible creators like Kenney, KayKit, Quaternius, and AlkaKrab.
          </p>
          <p className="text-xs md:text-sm text-muted-foreground/80 font-display leading-relaxed">
            This project wouldn't exist without their generosity. If Questerly succeeds, we're committed to giving back and supporting the creators who made it possible.
          </p>
        </div>

        {/* Logos */}
        <div className="flex items-center justify-center gap-8 md:gap-12 flex-wrap">
          {creators.map((creator, index) => (
            <motion.a
              key={creator.name}
              href={creator.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center justify-center transition-transform"
            >
              <img
                src={creator.logo}
                alt={`${creator.name} logo`}
                className="object-contain opacity-80 hover:opacity-100 transition-opacity"
                style={{ width: '120px', height: '56px', objectFit: 'contain' }}
              />
            </motion.a>
          ))}
        </div>
      </div>
    </footer>
  );
}
