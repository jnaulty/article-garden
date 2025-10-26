/**
 * Publisher Persona Settings Component
 *
 * UI for selecting between Simple, Balanced, and Advanced publishing modes.
 * Mirrors ReaderPersonaSettings pattern for consistency.
 */

import { Card, Flex, Heading, Text, Box, RadioGroup, Badge } from '@radix-ui/themes';
import { usePublisherPersona } from '../../hooks/usePublisherPersona';
import { AuthorPersona } from '../../types/persona';

interface PersonaOption {
  value: AuthorPersona;
  title: string;
  description: string;
  icon: string;
  features: string[];
  badge?: string;
}

const personaOptions: PersonaOption[] = [
  {
    value: 'simple',
    title: 'Simple Mode',
    description: 'Streamlined publishing experience with essential features',
    icon: '🎯',
    features: [
      'Quick publish flow',
      'Essential options only',
      'Spacious forms',
      'Minimal distractions',
    ],
    badge: 'Best for beginners',
  },
  {
    value: 'balanced',
    title: 'Balanced Mode',
    description: 'Standard publishing tools with helpful guidance',
    icon: '⚙️',
    features: [
      'Helpful guidance',
      'All core features',
      'Moderate density',
      'Practical workflow',
    ],
    badge: 'Recommended',
  },
  {
    value: 'advanced',
    title: 'Advanced Mode',
    description: 'Data-driven dashboard with comprehensive analytics',
    icon: '📊',
    features: [
      'Detailed analytics',
      'All options visible',
      'Compact layout',
      'Power user tools',
    ],
    badge: 'For professionals',
  },
];

export function PublisherPersonaSettings() {
  const { persona, setPersona } = usePublisherPersona();

  const handlePersonaChange = (value: string) => {
    setPersona(value as AuthorPersona);
  };

  return (
    <Card>
      <Flex direction="column" gap="5">
        {/* Header */}
        <Box>
          <Heading size="5" mb="2">
            Publishing Experience
          </Heading>
          <Text size="2" color="gray">
            Choose your preferred publishing and dashboard style. You can change this anytime.
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
            💡 Your publishing preference is saved automatically and syncs across devices.
          </Text>
        </Box>
      </Flex>
    </Card>
  );
}
