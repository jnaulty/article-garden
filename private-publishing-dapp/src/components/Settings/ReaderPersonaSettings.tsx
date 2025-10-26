/**
 * Reader Persona Settings Component
 *
 * Allows users to select their preferred reader experience style.
 * Displayed in settings/preferences page (not during onboarding).
 */

import { Card, Flex, Heading, Text, Box, RadioGroup, Badge } from '@radix-ui/themes';
import { useReaderPersona } from '../../hooks/useReaderPersona';
import { ReaderPersona } from '../../types/persona';

interface PersonaOption {
  value: ReaderPersona;
  title: string;
  description: string;
  icon: string;
  features: string[];
  badge?: string;
}

const personaOptions: PersonaOption[] = [
  {
    value: 'casual',
    title: 'Casual Reader',
    description: 'Clean and spacious design for discovering new content',
    icon: '🎨',
    features: [
      'Large imagery and hero sections',
      'Minimal distractions',
      'Discovery-focused browsing',
      'Simple, uncluttered layouts',
    ],
    badge: 'Best for exploring',
  },
  {
    value: 'dedicated',
    title: 'Dedicated Subscriber',
    description: 'Feed-focused experience with reading progress tracking',
    icon: '📚',
    features: [
      'Personalized article feed',
      'Reading progress tracking',
      'Continue reading section',
      'Efficient content consumption',
    ],
    badge: 'Recommended',
  },
  {
    value: 'default',
    title: 'Default',
    description: 'Standard reading experience',
    icon: '⚙️',
    features: [
      'Balanced design',
      'All features enabled',
      'Standard navigation',
      'Flexible layout',
    ],
  },
];

export function ReaderPersonaSettings() {
  const { persona, setPersona } = useReaderPersona();

  const handlePersonaChange = (value: string) => {
    setPersona(value as ReaderPersona);
  };

  return (
    <Card>
      <Flex direction="column" gap="5">
        {/* Header */}
        <Box>
          <Heading size="5" mb="2">
            Reading Experience
          </Heading>
          <Text size="2" color="gray">
            Choose how you'd like to browse and read content. You can change this anytime.
          </Text>
        </Box>

        {/* Persona Options */}
        <RadioGroup.Root value={persona} onValueChange={handlePersonaChange}>
          <Flex direction="column" gap="3">
            {personaOptions.map((option) => (
              <Card
                key={option.value}
                variant="surface"
                style={{
                  cursor: 'pointer',
                  border: persona === option.value ? '2px solid var(--accent-9)' : '1px solid var(--gray-a5)',
                  transition: 'all 0.2s ease',
                }}
                onClick={() => handlePersonaChange(option.value)}
              >
                <RadioGroup.Item value={option.value} style={{ display: 'none' }} />
                <Flex gap="4">
                  {/* Icon */}
                  <Box>
                    <Text size="8" style={{ lineHeight: '1' }}>
                      {option.icon}
                    </Text>
                  </Box>

                  {/* Content */}
                  <Flex direction="column" gap="2" style={{ flex: 1 }}>
                    <Flex align="center" gap="2">
                      <Heading size="4">{option.title}</Heading>
                      {option.badge && (
                        <Badge color="blue" variant="soft" size="1">
                          {option.badge}
                        </Badge>
                      )}
                    </Flex>

                    <Text size="2" color="gray">
                      {option.description}
                    </Text>

                    {/* Features List */}
                    <Flex direction="column" gap="1" mt="2">
                      {option.features.map((feature, index) => (
                        <Text key={index} size="1" color="gray">
                          • {feature}
                        </Text>
                      ))}
                    </Flex>
                  </Flex>

                  {/* Selection Indicator */}
                  {persona === option.value && (
                    <Flex align="center">
                      <Box
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          background: 'var(--accent-9)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Text size="1" style={{ color: 'white' }}>
                          ✓
                        </Text>
                      </Box>
                    </Flex>
                  )}
                </Flex>
              </Card>
            ))}
          </Flex>
        </RadioGroup.Root>

        {/* Info Footer */}
        <Box style={{ padding: '12px', background: 'var(--blue-a2)', borderRadius: '8px' }}>
          <Text size="2" color="gray">
            💡 Your preference is saved automatically and applies across all devices where you're signed in.
          </Text>
        </Box>
      </Flex>
    </Card>
  );
}
